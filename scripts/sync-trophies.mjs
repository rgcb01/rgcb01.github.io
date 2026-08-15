import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  getRecentlyPlayedGames,
  getTitleTrophies,
  getUserPlayedGames,
  getUserTitles,
  getUserTrophiesEarnedForTitle,
  getUserTrophyProfileSummary,
} from "psn-api";
import { gameOverrides } from "../src/data/trophies/gameOverrides.js";
import { trophyRoomSettings } from "../src/data/trophies/personalTrophyData.js";

const PSN_ONLINE_ID = trophyRoomSettings.psnOnlineId || "rgcb01";
const GENERATED_DIR = join("public", "data", "generated");
const DETAIL_DIR = join(GENERATED_DIR, "trophy-details");
const TMP_DIR = join(GENERATED_DIR, ".tmp-trophies");
const PSN_PAGE_SIZE = 800;
const PLAYED_GAMES_PAGE_SIZE = 200;
const TROPHY_PAGE_SIZE = 800;
const IGDB_RATE_LIMIT_MS = 350;
const IGDB_RETRY_DELAYS_MS = [1200, 2600, 5200];
const PREVIOUS_GENERATED_URL = "https://rgcb01.github.io/data/generated/trophy-games.json";
let lastIgdbRequestAt = 0;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function safeError(error) {
  return String(error?.message || error)
    .replace(/npsso\s*=\s*[^"\s;]+/gi, "npsso=[redacted]")
    .replace(/[A-Za-z0-9_-]{48,}/g, "[redacted]");
}

function normalizeNpssoInput(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) throw new Error("Missing required environment variable: PSN_NPSSO");

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed?.npsso) return String(parsed.npsso).trim();
  } catch {
    // The expected value is the raw token, but this also tolerates common copy formats.
  }

  return trimmed
    .replace(/^npsso\s*=\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function normalizeTitle(value = "") {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u2122\u00ae\u00a9]/g, "")
    .replace(/['\u2019]/g, "")
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/[^\w\s:.-]/g, " ")
    .replace(/\b(ps5|ps4|ps3|ps vita|vita|playstation 5|playstation 4|playstation 3)\b/g, "")
    .replace(/\btrophies\b/g, "")
    .replace(/\b(remastered|remaster|definitive edition|complete edition|deluxe edition|ultimate edition|game of the year edition|goty edition|standard edition|digital deluxe)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactTitle(value = "") {
  return normalizeTitle(value).replace(/[^a-z0-9]/g, "");
}

function slugify(value, fallback) {
  const slug = normalizeTitle(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || fallback.toLowerCase();
}

function uniqueSlug(baseSlug, usedSlugs, fallback) {
  if (!usedSlugs.has(baseSlug)) {
    usedSlugs.add(baseSlug);
    return baseSlug;
  }
  const suffix = fallback.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const candidate = `${baseSlug}-${suffix}`;
  if (!usedSlugs.has(candidate)) {
    usedSlugs.add(candidate);
    return candidate;
  }
  let index = 2;
  while (usedSlugs.has(`${candidate}-${index}`)) index += 1;
  usedSlugs.add(`${candidate}-${index}`);
  return `${candidate}-${index}`;
}

function pickImage(items = [], preferred = "cover") {
  const image = items[0];
  if (!image?.image_id) return null;
  const size = preferred === "cover" ? "cover_big_2x" : "1080p";
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${image.image_id}.jpg`;
}

async function fetchPsnPage(fetcher) {
  const all = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    const response = await fetcher(offset);
    const items = response.trophyTitles || response.trophies || [];
    all.push(...items);
    total = response.totalItemCount ?? all.length;
    if (!response.nextOffset || response.nextOffset <= offset) break;
    offset = response.nextOffset;
  }
  return all;
}

async function fetchPlayedGames(authorization) {
  const all = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    const response = await getUserPlayedGames(authorization, "me", { limit: PLAYED_GAMES_PAGE_SIZE, offset });
    all.push(...(response.titles || []));
    total = response.totalItemCount ?? all.length;
    if (!response.nextOffset || response.nextOffset <= offset) break;
    offset = response.nextOffset;
  }
  return all;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function authenticatePsn() {
  const accessCode = await exchangeNpssoForAccessCode(normalizeNpssoInput(requiredEnv("PSN_NPSSO")));
  const tokens = await exchangeAccessCodeForAuthTokens(accessCode);
  return { accessToken: tokens.accessToken };
}

async function fetchOptional(label, task, fallback) {
  try {
    return await task();
  } catch (error) {
    console.warn(`${label}: unavailable (${safeError(error)})`);
    return fallback;
  }
}

async function authenticateIgdb() {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientCredential = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientCredential) {
    console.log("IGDB enrichment skipped: credentials not configured.");
    return null;
  }
  const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientCredential)}&grant_type=client_credentials`, {
    method: "POST",
  });
  if (!response.ok) throw new Error(`IGDB auth failed with status ${response.status}`);
  const payload = await response.json();
  console.log("IGDB authentication: OK");
  console.log("IGDB enrichment enabled");
  return { clientId, accessToken: payload.access_token };
}

async function igdbQuery(auth, body) {
  for (let attempt = 0; attempt <= IGDB_RETRY_DELAYS_MS.length; attempt += 1) {
    const elapsed = Date.now() - lastIgdbRequestAt;
    if (elapsed < IGDB_RATE_LIMIT_MS) await sleep(IGDB_RATE_LIMIT_MS - elapsed);
    lastIgdbRequestAt = Date.now();

    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": auth.clientId,
        Authorization: ["Bearer", auth.accessToken].join(" "),
        Accept: "application/json",
        "Content-Type": "text/plain",
      },
      body,
    });

    if (response.ok) return response.json();
    if (response.status === 429 && attempt < IGDB_RETRY_DELAYS_MS.length) {
      await sleep(IGDB_RETRY_DELAYS_MS[attempt]);
      continue;
    }
    throw new Error(`IGDB request failed with status ${response.status}`);
  }
  throw new Error("IGDB request failed after retries");
}

function mapIgdbGame(game) {
  if (!game) return null;
  const developers = (game.involved_companies || [])
    .filter((item) => item.developer && item.company?.name)
    .map((item) => item.company.name);
  const publishers = (game.involved_companies || [])
    .filter((item) => item.publisher && item.company?.name)
    .map((item) => item.company.name);
  return {
    igdbId: game.id,
    title: game.name || null,
    cover: pickImage(game.cover ? [game.cover] : [], "cover"),
    artwork: pickImage(game.artworks || [], "artwork"),
    screenshots: (game.screenshots || []).slice(0, 4).map((item) => pickImage([item], "artwork")).filter(Boolean),
    releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString() : null,
    platforms: (game.platforms || []).map((item) => item.abbreviation || item.name).filter(Boolean),
    genres: (game.genres || []).map((item) => item.name).filter(Boolean),
    developer: developers.length ? developers.join(", ") : null,
    publisher: publishers.length ? publishers.join(", ") : null,
    summary: game.summary || null,
  };
}

function igdbPlatforms(candidate) {
  return (candidate.platforms || [])
    .flatMap((platform) => [platform.abbreviation, platform.name])
    .filter(Boolean)
    .map((platform) => String(platform).toUpperCase());
}

function hasCompatiblePlatform(title, candidate) {
  const psnPlatforms = normalizePlatforms(title.trophyTitlePlatform);
  const candidatePlatforms = igdbPlatforms(candidate);
  if (!psnPlatforms.length || !candidatePlatforms.length) return false;
  return psnPlatforms.some((platform) => {
    if (platform === "PSVita") return candidatePlatforms.some((item) => item.includes("VITA"));
    return candidatePlatforms.includes(platform) || candidatePlatforms.includes(platform.replace("PS", "PLAYSTATION "));
  });
}

function scoreIgdbCandidate(title, candidate) {
  const psnNormalized = normalizeTitle(title.trophyTitleName);
  const candidateNormalized = normalizeTitle(candidate.name);
  const psnCompact = compactTitle(title.trophyTitleName);
  const candidateCompact = compactTitle(candidate.name);
  let score = 0;
  const reasons = [];

  if (candidateNormalized === psnNormalized) {
    score += 0.7;
    reasons.push("normalized-title");
  } else if (candidateCompact === psnCompact) {
    score += 0.66;
    reasons.push("compact-title");
  } else if (candidateNormalized.includes(psnNormalized) || psnNormalized.includes(candidateNormalized)) {
    score += 0.38;
    reasons.push("title-contains");
  }

  if (hasCompatiblePlatform(title, candidate)) {
    score += 0.22;
    reasons.push("platform");
  }

  if (candidate.category === 0 || candidate.category === undefined) {
    score += 0.04;
  } else {
    score -= 0.08;
    reasons.push("non-main-category");
  }

  return { candidate, score: Math.max(0, Math.min(1, Number(score.toFixed(2)))), reasons };
}

function chooseIgdbCandidate(title, candidates) {
  if (!Array.isArray(candidates) || !candidates.length) {
    return { status: "unresolved", game: null, matchMethod: "no-candidates", matchConfidence: null };
  }

  const scored = candidates
    .map((candidate) => scoreIgdbCandidate(title, candidate))
    .filter((item) => item.score >= 0.66)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    return { status: "unresolved", game: null, matchMethod: "low-confidence", matchConfidence: null };
  }

  const [best, second] = scored;
  if (second && best.score - second.score < 0.08) {
    return {
      status: "ambiguous",
      game: null,
      matchMethod: "ambiguous-candidates",
      matchConfidence: best.score,
    };
  }

  return {
    status: "matched",
    game: mapIgdbGame(best.candidate),
    matchMethod: best.reasons.join("-") || "scored",
    matchConfidence: best.score,
  };
}

async function enrichWithIgdb(auth, title) {
  if (!auth) return { status: "igdb-skipped", game: null };
  const override = gameOverrides[title.npCommunicationId];
  const fields = "fields id,name,summary,first_release_date,category,version_title,cover.image_id,artworks.image_id,screenshots.image_id,platforms.name,platforms.abbreviation,genres.name,involved_companies.developer,involved_companies.publisher,involved_companies.company.name;";
  if (override?.igdbId) {
    const [game] = await igdbQuery(auth, `${fields} where id = ${Number(override.igdbId)}; limit 1;`);
    return {
      status: game ? "manual-override" : "manual-override-unresolved",
      game: mapIgdbGame(game),
      matchMethod: "manual-override",
      matchConfidence: game ? 1 : null,
    };
  }

  const query = (normalizeTitle(title.trophyTitleName) || title.trophyTitleName).replace(/"/g, '\\"');
  const candidates = await igdbQuery(auth, `search "${query}"; ${fields} limit 10;`);
  return chooseIgdbCandidate(title, candidates);
}

async function safelyEnrichWithIgdb(auth, title, previousIgdbCache) {
  try {
    return await enrichTitle(auth, title, previousIgdbCache);
  } catch (error) {
    console.warn(`IGDB enrichment unavailable for ${title.npCommunicationId}: ${safeError(error)}`);
    return { status: "igdb-unavailable", game: null, matchMethod: "igdb-error", matchConfidence: null };
  }
}

async function loadPreviousIgdbCache() {
  const cache = new Map();
  try {
    const response = await fetch(PREVIOUS_GENERATED_URL, { cache: "no-store" });
    if (!response.ok) return cache;
    const payload = await response.json();
    for (const game of payload.games || []) {
      const psnTitleId = game.sources?.psnTitleId;
      const igdbId = game.sources?.igdbId;
      if (psnTitleId && igdbId) cache.set(psnTitleId, igdbId);
    }
  } catch (error) {
    console.warn(`Previous IGDB cache unavailable: ${safeError(error)}`);
  }
  return cache;
}

async function enrichTitle(auth, title, previousIgdbCache) {
  if (!auth) return { status: "igdb-skipped", game: null, matchMethod: "igdb-disabled", matchConfidence: null };
  const cachedIgdbId = previousIgdbCache.get(title.npCommunicationId);
  if (cachedIgdbId && !gameOverrides[title.npCommunicationId]?.igdbId) {
    const fields = "fields id,name,summary,first_release_date,category,version_title,cover.image_id,artworks.image_id,screenshots.image_id,platforms.name,platforms.abbreviation,genres.name,involved_companies.developer,involved_companies.publisher,involved_companies.company.name;";
    const [game] = await igdbQuery(auth, `${fields} where id = ${Number(cachedIgdbId)}; limit 1;`);
    if (game) {
      return {
        status: "matched",
        game: mapIgdbGame(game),
        matchMethod: "previous-igdb-id",
        matchConfidence: 1,
      };
    }
  }
  return enrichWithIgdb(auth, title);
}

function normalizePlatforms(value = "") {
  return String(value)
    .split(",")
    .map((item) => item.trim().toUpperCase().replace("PSVITA", "PSVita"))
    .filter(Boolean);
}

function mergeTrophies(titleTrophies, userTrophies) {
  const earnedById = new Map(userTrophies.map((trophy) => [trophy.trophyId, trophy]));
  return titleTrophies.map((trophy) => {
    const earned = earnedById.get(trophy.trophyId) || {};
    return {
      id: trophy.trophyId,
      groupId: trophy.trophyGroupId || earned.trophyGroupId || "default",
      name: trophy.trophyName || null,
      description: trophy.trophyDetail || null,
      type: trophy.trophyType || earned.trophyType || null,
      hidden: Boolean(trophy.trophyHidden || earned.trophyHidden),
      icon: trophy.trophyIconUrl || null,
      earned: Boolean(earned.earned),
      earnedDate: earned.earnedDateTime || null,
      rarity: earned.trophyRare || null,
      earnedRate: earned.trophyEarnedRate || null,
    };
  });
}

function buildGameRecord(title, enrichment, trophies, playedGame, recentGame, syncedAt, usedSlugs) {
  const psnTitleId = title.npCommunicationId;
  const slug = uniqueSlug(slugify(title.trophyTitleName, psnTitleId), usedSlugs, psnTitleId);
  const earnedTrophies = trophies.filter((trophy) => trophy.earned);
  const platinum = trophies.find((trophy) => trophy.type === "platinum");
  const earnedPlatinum = trophies.find((trophy) => trophy.type === "platinum" && trophy.earned);
  const dates = earnedTrophies.map((trophy) => trophy.earnedDate).filter(Boolean).sort();
  const defined = title.definedTrophies || {};
  const earned = title.earnedTrophies || {};
  const total = ["bronze", "silver", "gold", "platinum"].reduce((sum, key) => sum + Number(defined[key] || 0), 0);
  const earnedTotal = ["bronze", "silver", "gold", "platinum"].reduce((sum, key) => sum + Number(earned[key] || 0), 0);
  const igdb = enrichment.game;
  const platforms = igdb?.platforms?.length ? igdb.platforms : normalizePlatforms(title.trophyTitlePlatform);

  return {
    id: `playstation:${psnTitleId}`,
    internalGameId: igdb?.igdbId ? `igdb:${igdb.igdbId}` : `psn:${psnTitleId}`,
    source: "playstation",
    slug,
    identities: {
      psn: {
        titleId: psnTitleId,
        serviceName: title.npServiceName,
      },
      ...(igdb?.igdbId ? { igdb: { id: igdb.igdbId } } : {}),
    },
    sources: {
      psnTitleId,
      psnServiceName: title.npServiceName,
      igdbId: igdb?.igdbId ?? null,
    },
    game: {
      title: igdb?.title || title.trophyTitleName || null,
      cover: igdb?.cover || title.trophyTitleIconUrl || null,
      artwork: igdb?.artwork || null,
      screenshots: igdb?.screenshots || [],
      releaseDate: igdb?.releaseDate || null,
      platforms,
      genres: igdb?.genres || [],
      developer: igdb?.developer || null,
      publisher: igdb?.publisher || null,
      summary: igdb?.summary || null,
      psnIcon: title.trophyTitleIconUrl || null,
    },
    trophyProgress: {
      progressPercent: title.progress ?? null,
      earned: earnedTotal,
      total,
      counts: {
        bronze: earned.bronze || 0,
        silver: earned.silver || 0,
        gold: earned.gold || 0,
        platinum: earned.platinum || 0,
      },
      platinumEarned: Boolean(earnedPlatinum || earned.platinum),
      platinumTrophyName: platinum?.name || null,
      platinumEarnedDate: earnedPlatinum?.earnedDate || null,
      firstTrophyDate: dates[0] || null,
      lastTrophyDate: dates.at(-1) || title.lastUpdatedDateTime || null,
    },
    playtime: playedGame?.playDuration || playedGame?.playtime || null,
    recentActivityDate: playedGame?.lastPlayedDateTime || recentGame?.lastPlayedDateTime || title.lastUpdatedDateTime || null,
    sync: {
      psnUpdatedAt: title.lastUpdatedDateTime || syncedAt,
      igdbUpdatedAt: enrichment.game ? syncedAt : null,
      enrichmentStatus: enrichment.status,
      matchMethod: enrichment.matchMethod || null,
      matchConfidence: enrichment.matchConfidence ?? null,
    },
  };
}

function chooseCurrentHunt(games) {
  const manualId = trophyRoomSettings.currentPlatinumHunt;
  if (manualId) return games.find((game) => game.sources.psnTitleId === manualId)?.slug || null;
  const candidates = games
    .filter((game) => !game.trophyProgress.platinumEarned && game.trophyProgress.progressPercent > 5 && game.trophyProgress.progressPercent < 100)
    .sort((a, b) => new Date(b.recentActivityDate || 0) - new Date(a.recentActivityDate || 0));
  if (!candidates.length) return null;
  if (candidates[1] && candidates[0].recentActivityDate === candidates[1].recentActivityDate) return null;
  return candidates[0].slug;
}

function atomicWriteJson(path, payload) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp`;
  writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`);
  renameSync(temp, path);
}

function assertSafeGeneratedData(profilePayload, gamesPayload, details) {
  const serialized = JSON.stringify([profilePayload, gamesPayload, details]);
  const forbidden = ["npsso", "accessToken", "refreshToken", "clientSecret", "Bearer "];
  for (const term of forbidden) {
    if (serialized.includes(term)) throw new Error(`Generated trophy data contains forbidden token marker: ${term}`);
  }
  if (!Array.isArray(gamesPayload.games)) throw new Error("Generated trophy data is missing its games array.");
  const slugs = new Set();
  for (const game of gamesPayload.games) {
    if (!game.slug) throw new Error("Generated trophy game is missing a slug.");
    if (slugs.has(game.slug)) throw new Error(`Generated duplicate trophy game slug: ${game.slug}`);
    slugs.add(game.slug);
  }
}

function publishGeneratedData(profilePayload, gamesPayload, details) {
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(join(TMP_DIR, "trophy-details"), { recursive: true });
  writeFileSync(join(TMP_DIR, "psn-profile.json"), `${JSON.stringify(profilePayload, null, 2)}\n`);
  writeFileSync(join(TMP_DIR, "trophy-games.json"), `${JSON.stringify(gamesPayload, null, 2)}\n`);
  for (const detail of details) {
    writeFileSync(join(TMP_DIR, "trophy-details", `${detail.slug}.json`), `${JSON.stringify(detail.payload, null, 2)}\n`);
  }

  mkdirSync(GENERATED_DIR, { recursive: true });
  atomicWriteJson(join(GENERATED_DIR, "psn-profile.json"), profilePayload);
  atomicWriteJson(join(GENERATED_DIR, "trophy-games.json"), gamesPayload);
  rmSync(DETAIL_DIR, { recursive: true, force: true });
  mkdirSync(DETAIL_DIR, { recursive: true });
  for (const file of readdirSync(join(TMP_DIR, "trophy-details")).filter((item) => item.endsWith(".json"))) {
    copyFileSync(join(TMP_DIR, "trophy-details", file), join(DETAIL_DIR, file));
  }
  rmSync(TMP_DIR, { recursive: true, force: true });
}

async function main() {
  const syncedAt = new Date().toISOString();
  try {
    const authorization = await authenticatePsn();
    const igdbAuth = await fetchOptional("IGDB authentication", () => authenticateIgdb(), null);
    const previousIgdbCache = igdbAuth ? await loadPreviousIgdbCache() : new Map();
    const profileSummary = await getUserTrophyProfileSummary(authorization, "me");
    const titles = await fetchPsnPage((offset) => getUserTitles(authorization, "me", { limit: PSN_PAGE_SIZE, offset }));
    const recentGames = await fetchOptional("Recently played games", () => getRecentlyPlayedGames(authorization, { limit: 20 }), null);
    const playedGames = await fetchOptional("Played games", () => fetchPlayedGames(authorization), []);
    const recentGameList = recentGames?.data?.gameLibraryTitlesRetrieve?.games || [];
    const details = [];
    const records = [];
    const usedSlugs = new Set();

    for (const title of titles) {
      const options = { npServiceName: title.npServiceName, limit: TROPHY_PAGE_SIZE };
      const [titleTrophies, userTrophies, enrichment] = await Promise.all([
        fetchPsnPage((offset) => getTitleTrophies(authorization, title.npCommunicationId, "all", { ...options, offset })),
        fetchPsnPage((offset) => getUserTrophiesEarnedForTitle(authorization, "me", title.npCommunicationId, "all", { ...options, offset })),
        safelyEnrichWithIgdb(igdbAuth, title, previousIgdbCache),
      ]);
      const trophies = mergeTrophies(titleTrophies, userTrophies);
      const playedGame = playedGames.find((item) => item.name === title.trophyTitleName || item.titleName === title.trophyTitleName);
      const recentGame = recentGameList.find((item) => item.name === title.trophyTitleName || item.titleName === title.trophyTitleName);
      const record = buildGameRecord(title, enrichment, trophies, playedGame, recentGame, syncedAt, usedSlugs);
      records.push(record);
      details.push({ slug: record.slug, payload: { source: "playstation", synchronized: true, syncedAt, game: record, trophies } });
    }

    const platinums = records.filter((game) => game.trophyProgress.platinumEarned && game.trophyProgress.platinumEarnedDate);
    const latestPlatinumSlug = platinums.sort((a, b) => new Date(b.trophyProgress.platinumEarnedDate) - new Date(a.trophyProgress.platinumEarnedDate))[0]?.slug || null;
    const completeGameCount = records.filter((game) => game.trophyProgress.progressPercent === 100).length;
    const averageCompletion = records.length ? Math.round(records.reduce((sum, game) => sum + Number(game.trophyProgress.progressPercent || 0), 0) / records.length) : null;
    const igdbMatched = records.filter((game) => game.sync.enrichmentStatus === "matched" || game.sync.enrichmentStatus === "manual-override").length;
    const igdbManualOverrides = records.filter((game) => game.sync.enrichmentStatus === "manual-override").length;
    const igdbAmbiguous = records.filter((game) => game.sync.enrichmentStatus === "ambiguous").length;
    const igdbUnresolved = records.filter((game) => game.sync.enrichmentStatus.includes("unresolved") || game.sync.enrichmentStatus === "igdb-unavailable").length;
    const metadataCoverage = {
      covers: records.filter((game) => game.game.cover).length,
      artwork: records.filter((game) => game.game.artwork).length,
      screenshots: records.filter((game) => game.game.screenshots?.length).length,
      developers: records.filter((game) => game.game.developer).length,
      publishers: records.filter((game) => game.game.publisher).length,
      genres: records.filter((game) => game.game.genres?.length).length,
      releaseDates: records.filter((game) => game.game.releaseDate).length,
    };
    const profilePayload = {
      source: "playstation",
      psnOnlineId: PSN_ONLINE_ID,
      synchronized: true,
      syncedAt,
      profile: profileSummary,
      stats: {
        gameCount: records.length,
        averageCompletion,
        completeGameCount,
        latestPlatinumSlug,
        currentPlatinumHuntSlug: chooseCurrentHunt(records),
        igdbMatched,
        igdbManualOverrides,
        igdbAmbiguous,
        igdbUnresolved,
        metadataCoverage,
      },
    };
    const gamesPayload = { source: "playstation", synchronized: true, syncedAt, games: records };

    assertSafeGeneratedData(profilePayload, gamesPayload, details);
    publishGeneratedData(profilePayload, gamesPayload, details);

    console.log("PSN Sync");
    console.log(`User: ${PSN_ONLINE_ID}`);
    console.log(`Titles: ${records.length}`);
    console.log(`Platinums: ${records.filter((game) => game.trophyProgress.platinumEarned).length}`);
    if (igdbAuth) {
      console.log("");
      console.log("IGDB Enrichment");
      console.log(`Matched: ${igdbMatched}`);
      console.log(`Manual overrides: ${igdbManualOverrides}`);
      console.log(`Ambiguous: ${igdbAmbiguous}`);
      console.log(`Unresolved: ${igdbUnresolved}`);
      console.log("");
      console.log("Metadata");
      console.log(`Covers: ${metadataCoverage.covers}`);
      console.log(`Artwork: ${metadataCoverage.artwork}`);
      console.log(`Screenshots: ${metadataCoverage.screenshots}`);
      console.log(`Developers: ${metadataCoverage.developers}`);
      console.log(`Publishers: ${metadataCoverage.publishers}`);
      console.log(`Genres: ${metadataCoverage.genres}`);
      console.log(`Release dates: ${metadataCoverage.releaseDates}`);
      const needsReview = records.filter((game) => ["ambiguous", "unresolved", "igdb-unavailable", "manual-override-unresolved"].includes(game.sync.enrichmentStatus));
      if (needsReview.length) {
        console.log("");
        console.log("Needs review:");
        for (const game of needsReview) {
          console.log(`- ${game.game.title} - ${game.sources.psnTitleId} - ${game.game.platforms.join(", ") || "Platform unknown"} - ${game.sync.enrichmentStatus}`);
        }
      }
    } else {
      console.log("IGDB enrichment: skipped");
    }
    console.log("Generated: public/data/generated/trophy-games.json");
  } catch (error) {
    rmSync(TMP_DIR, { recursive: true, force: true });
    console.error(`Trophy sync failed: ${safeError(error)}`);
    if (existsSync(join(GENERATED_DIR, "trophy-games.json"))) {
      console.error("Last generated dataset was preserved.");
    }
    process.exitCode = 1;
  }
}

main();
