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
const TROPHY_PAGE_SIZE = 800;

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
    .replace(/[^\w\s:.-]/g, " ")
    .replace(/\b(ps5|ps4|ps3|ps vita|vita|playstation 5|playstation 4|playstation 3)\b/g, "")
    .replace(/\b(remastered|remaster|definitive edition|complete edition|deluxe edition|ultimate edition|game of the year edition|goty edition|standard edition|digital deluxe)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
  const size = preferred === "cover" ? "cover_big" : "screenshot_big";
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
    const response = await getUserPlayedGames(authorization, "me", { limit: PSN_PAGE_SIZE, offset });
    all.push(...(response.titles || []));
    total = response.totalItemCount ?? all.length;
    if (!response.nextOffset || response.nextOffset <= offset) break;
    offset = response.nextOffset;
  }
  return all;
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
  return { clientId, accessToken: payload.access_token };
}

async function igdbQuery(auth, body) {
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
  if (!response.ok) throw new Error(`IGDB request failed with status ${response.status}`);
  return response.json();
}

function mapIgdbGame(game) {
  if (!game) return null;
  return {
    igdbId: game.id,
    title: game.name || null,
    cover: pickImage(game.cover ? [game.cover] : [], "cover"),
    artwork: pickImage(game.artworks || [], "artwork"),
    screenshots: (game.screenshots || []).slice(0, 4).map((item) => pickImage([item], "artwork")).filter(Boolean),
    releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString() : null,
    platforms: (game.platforms || []).map((item) => item.abbreviation || item.name).filter(Boolean),
    genres: (game.genres || []).map((item) => item.name).filter(Boolean),
    developer: (game.involved_companies || []).find((item) => item.developer)?.company?.name || null,
    publisher: (game.involved_companies || []).find((item) => item.publisher)?.company?.name || null,
    summary: game.summary || null,
  };
}

async function enrichWithIgdb(auth, title) {
  if (!auth) return { status: "igdb-skipped", game: null };
  const override = gameOverrides[title.npCommunicationId];
  const fields = "fields id,name,summary,first_release_date,cover.image_id,artworks.image_id,screenshots.image_id,platforms.name,platforms.abbreviation,genres.name,involved_companies.developer,involved_companies.publisher,involved_companies.company.name;";
  if (override?.igdbId) {
    const [game] = await igdbQuery(auth, `${fields} where id = ${Number(override.igdbId)}; limit 1;`);
    return { status: game ? "manual-override" : "manual-override-unresolved", game: mapIgdbGame(game) };
  }

  const query = title.trophyTitleName.replace(/"/g, '\\"');
  const candidates = await igdbQuery(auth, `search "${query}"; ${fields} limit 10;`);
  const normalized = normalizeTitle(title.trophyTitleName);
  const exactMatches = candidates.filter((candidate) => normalizeTitle(candidate.name) === normalized);
  if (exactMatches.length === 1) return { status: "matched", game: mapIgdbGame(exactMatches[0]) };
  return { status: "unresolved", game: null };
}

async function safelyEnrichWithIgdb(auth, title) {
  try {
    return await enrichWithIgdb(auth, title);
  } catch (error) {
    console.warn(`IGDB enrichment unavailable for ${title.npCommunicationId}: ${safeError(error)}`);
    return { status: "igdb-unavailable", game: null };
  }
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
    source: "playstation",
    slug,
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
        safelyEnrichWithIgdb(igdbAuth, title),
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
    const igdbUnresolved = records.filter((game) => game.sync.enrichmentStatus.includes("unresolved") || game.sync.enrichmentStatus === "igdb-unavailable").length;
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
        igdbUnresolved,
      },
    };
    const gamesPayload = { source: "playstation", synchronized: true, syncedAt, games: records };

    assertSafeGeneratedData(profilePayload, gamesPayload, details);
    publishGeneratedData(profilePayload, gamesPayload, details);

    console.log("PSN Sync");
    console.log(`User: ${PSN_ONLINE_ID}`);
    console.log(`Titles: ${records.length}`);
    console.log(`Platinums: ${records.filter((game) => game.trophyProgress.platinumEarned).length}`);
    console.log(igdbAuth ? `IGDB matched: ${igdbMatched}` : "IGDB enrichment: skipped");
    if (igdbAuth) console.log(`IGDB unresolved: ${igdbUnresolved}`);
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
