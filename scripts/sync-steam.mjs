import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const GENERATED_DIR = join("public", "data", "generated", "steam");
const ACHIEVEMENT_DIR = join(GENERATED_DIR, "achievements");
const TMP_DIR = join("public", "data", "generated", ".tmp-steam");
const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM_CDN_BASE = "https://media.steampowered.com/steamcommunity/public/images/apps";
const PREVIOUS_STEAM_URL = "https://rgcb01.github.io/data/generated/steam/games.json";
const IGDB_RATE_LIMIT_MS = 350;
const STEAM_RATE_LIMIT_MS = 450;
const STEAM_RETRY_DELAYS_MS = [1200, 2600, 5200];
const ACHIEVEMENT_REFRESH_LIMIT = 40;
let lastIgdbRequestAt = 0;
let lastSteamRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeError(error) {
  return String(error?.message || error)
    .replace(/key=([^&\s]+)/gi, "key=[redacted]")
    .replace(/client_secret=([^&\s]+)/gi, "client_secret=[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/[A-Za-z0-9_-]{48,}/g, "[redacted]");
}

function atomicWriteJson(path, payload) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp`;
  writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`);
  renameSync(temp, path);
}

function readJsonIfExists(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function unavailablePayloads(reason = "Steam credentials are not configured.") {
  const generatedAt = new Date().toISOString();
  return {
    profile: {
      source: "steam",
      synchronized: false,
      available: false,
      status: "unavailable",
      generatedAt,
      reason,
    },
    games: {
      source: "steam",
      synchronized: false,
      available: false,
      generatedAt,
      games: [],
    },
    recent: {
      source: "steam",
      synchronized: false,
      available: false,
      generatedAt,
      games: [],
    },
    summary: {
      source: "steam",
      synchronized: false,
      available: false,
      status: "unavailable",
      ownedGames: 0,
      totalPlaytimeMinutes: 0,
      totalPlaytimeHours: 0,
      recentlyPlayedCount: 0,
      gamesWithAchievementData: 0,
      totalAchievementsEarned: 0,
      totalAchievementsAvailable: 0,
      perfectGames: 0,
      igdbMatched: 0,
      igdbAmbiguous: 0,
      igdbUnresolved: 0,
      achievementCoverageLimited: true,
      lastSyncedAt: null,
      generatedAt,
      reason,
    },
  };
}

function publishPayloads({ profile, games, recent, summary, achievements }) {
  assertSafeGeneratedData([profile, games, recent, summary, achievements]);
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(join(TMP_DIR, "achievements"), { recursive: true });
  writeFileSync(join(TMP_DIR, "profile.json"), `${JSON.stringify(profile, null, 2)}\n`);
  writeFileSync(join(TMP_DIR, "games.json"), `${JSON.stringify(games, null, 2)}\n`);
  writeFileSync(join(TMP_DIR, "recently-played.json"), `${JSON.stringify(recent, null, 2)}\n`);
  writeFileSync(join(TMP_DIR, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  for (const achievement of achievements || []) {
    writeFileSync(join(TMP_DIR, "achievements", `${achievement.appId}.json`), `${JSON.stringify(achievement, null, 2)}\n`);
  }

  mkdirSync(ACHIEVEMENT_DIR, { recursive: true });
  atomicWriteJson(join(GENERATED_DIR, "profile.json"), profile);
  atomicWriteJson(join(GENERATED_DIR, "games.json"), games);
  atomicWriteJson(join(GENERATED_DIR, "recently-played.json"), recent);
  atomicWriteJson(join(GENERATED_DIR, "summary.json"), summary);
  rmSync(ACHIEVEMENT_DIR, { recursive: true, force: true });
  mkdirSync(ACHIEVEMENT_DIR, { recursive: true });
  for (const achievement of achievements || []) {
    atomicWriteJson(join(ACHIEVEMENT_DIR, `${achievement.appId}.json`), achievement);
  }
  rmSync(TMP_DIR, { recursive: true, force: true });
}

function assertSafeGeneratedData(payloads) {
  const serialized = JSON.stringify(payloads);
  const forbidden = ["STEAM_API_KEY", "client_secret", "accessToken", "refreshToken", "Bearer ", "apiKey"];
  for (const term of forbidden) {
    if (serialized.includes(term)) throw new Error(`Generated Steam data contains forbidden token marker: ${term}`);
  }
  if (/key=[A-Za-z0-9_-]{20,}/i.test(serialized)) throw new Error("Generated Steam data contains a key query marker.");
}

async function steamGet(path, params) {
  const url = new URL(`${STEAM_API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });
  for (let attempt = 0; attempt <= STEAM_RETRY_DELAYS_MS.length; attempt += 1) {
    const elapsed = Date.now() - lastSteamRequestAt;
    if (elapsed < STEAM_RATE_LIMIT_MS) await sleep(STEAM_RATE_LIMIT_MS - elapsed);
    lastSteamRequestAt = Date.now();

    const response = await fetch(url);
    if (response.ok) return response.json();
    if ([429, 500, 502, 503, 504].includes(response.status) && attempt < STEAM_RETRY_DELAYS_MS.length) {
      await sleep(STEAM_RETRY_DELAYS_MS[attempt]);
      continue;
    }
    throw new Error(`Steam request failed with status ${response.status} for ${path}`);
  }
  throw new Error(`Steam request failed after retries for ${path}`);
}

function normalizeTitle(value = "") {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u2122\u00ae\u00a9]/g, "")
    .replace(/['\u2019]/g, "")
    .replace(/[^\w\s:.-]/g, " ")
    .replace(/\b(remastered|remaster|definitive edition|complete edition|deluxe edition|ultimate edition|game of the year edition|goty edition)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value, fallback) {
  const slug = normalizeTitle(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || `steam-${fallback}`;
}

function uniqueSlug(baseSlug, usedSlugs, fallback) {
  if (!usedSlugs.has(baseSlug)) {
    usedSlugs.add(baseSlug);
    return baseSlug;
  }
  const candidate = `${baseSlug}-${fallback}`;
  usedSlugs.add(candidate);
  return candidate;
}

function imageUrl(appId, hash) {
  return hash ? `${STEAM_CDN_BASE}/${appId}/${hash}.jpg` : null;
}

function isoFromUnix(value) {
  const timestamp = Number(value || 0);
  return timestamp > 0 ? new Date(timestamp * 1000).toISOString() : null;
}

function hours(minutes) {
  return Number((Number(minutes || 0) / 60).toFixed(1));
}

function readLocalAchievementCache() {
  const cache = new Map();
  const games = readJsonIfExists(join(GENERATED_DIR, "games.json"), { games: [] });
  for (const game of games.games || []) {
    if (game.appId && game.achievements) cache.set(Number(game.appId), game.achievements);
  }
  return cache;
}

async function loadPreviousSteamCache() {
  const cache = new Map();
  try {
    const response = await fetch(PREVIOUS_STEAM_URL, { cache: "no-store" });
    if (!response.ok) return cache;
    const payload = await response.json();
    for (const game of payload.games || []) {
      if (game.appId && game.achievements) cache.set(Number(game.appId), game.achievements);
    }
  } catch (error) {
    console.warn(`Previous Steam cache unavailable: ${safeError(error)}`);
  }
  return cache;
}

async function fetchAchievementRecord(key, steamId, appId) {
  try {
    const payload = await steamGet("/ISteamUserStats/GetPlayerAchievements/v0001/", {
      key,
      steamid: steamId,
      appid: appId,
      l: "en",
      format: "json",
    });
    const stats = payload?.playerstats;
    if (!stats?.success || !Array.isArray(stats.achievements) || !stats.achievements.length) return null;
    const total = stats.achievements.length;
    const earned = stats.achievements.filter((item) => Number(item.achieved) === 1).length;
    const latestUnlock = stats.achievements
      .map((item) => Number(item.unlocktime || 0))
      .filter(Boolean)
      .sort((a, b) => b - a)[0];
    return {
      appId: Number(appId),
      source: "steam",
      synchronized: true,
      achievements: {
        earned,
        total,
        percent: total ? Number(((earned / total) * 100).toFixed(1)) : null,
        perfect: total > 0 && earned === total,
        latestUnlock: isoFromUnix(latestUnlock),
      },
      items: stats.achievements.map((item) => ({
        apiName: item.apiname || item.name || null,
        name: item.name || null,
        description: item.description || null,
        earned: Number(item.achieved) === 1,
        unlockTime: isoFromUnix(item.unlocktime),
      })),
    };
  } catch (error) {
    console.warn(`Steam achievements unavailable for ${appId}: ${safeError(error)}`);
    return null;
  }
}

async function authenticateIgdb() {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientCredential = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientCredential) return null;
  const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientCredential)}&grant_type=client_credentials`, {
    method: "POST",
  });
  if (!response.ok) throw new Error(`IGDB auth failed with status ${response.status}`);
  const payload = await response.json();
  return { clientId, accessToken: payload.access_token };
}

async function igdbQuery(auth, body) {
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
  if (!response.ok) throw new Error(`IGDB request failed with status ${response.status}`);
  return response.json();
}

function pickIgdbImage(items = [], preferred = "cover") {
  const image = items[0];
  if (!image?.image_id) return null;
  const size = preferred === "cover" ? "cover_big_2x" : "1080p";
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${image.image_id}.jpg`;
}

function mapIgdbGame(game) {
  if (!game) return null;
  return {
    igdbId: game.id,
    title: game.name || null,
    cover: pickIgdbImage(game.cover ? [game.cover] : [], "cover"),
    artwork: pickIgdbImage(game.artworks || [], "artwork"),
    releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString() : null,
    platforms: (game.platforms || []).map((item) => item.abbreviation || item.name).filter(Boolean),
    genres: (game.genres || []).map((item) => item.name).filter(Boolean),
  };
}

function scoreIgdbCandidate(game, candidate) {
  const steamTitle = normalizeTitle(game.name);
  const candidateTitle = normalizeTitle(candidate.name);
  let score = 0;
  if (steamTitle === candidateTitle) score += 0.78;
  else if (steamTitle && (steamTitle.includes(candidateTitle) || candidateTitle.includes(steamTitle))) score += 0.42;
  const platforms = (candidate.platforms || []).flatMap((platform) => [platform.name, platform.abbreviation]).filter(Boolean).join(" ").toLowerCase();
  if (platforms.includes("pc") || platforms.includes("windows")) score += 0.18;
  if (candidate.category === 0 || candidate.category === undefined) score += 0.04;
  return Number(score.toFixed(2));
}

async function enrichSteamGame(auth, game) {
  if (!auth) return { status: "igdb-skipped", game: null, matchConfidence: null };
  const query = normalizeTitle(game.name).replace(/"/g, '\\"');
  if (!query) return { status: "unresolved", game: null, matchConfidence: null };
  const fields = "fields id,name,first_release_date,category,cover.image_id,artworks.image_id,platforms.name,platforms.abbreviation,genres.name;";
  const candidates = await igdbQuery(auth, `search "${query}"; ${fields} limit 10;`);
  const scored = candidates
    .map((candidate) => ({ candidate, score: scoreIgdbCandidate(game, candidate) }))
    .filter((item) => item.score >= 0.8)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return { status: "unresolved", game: null, matchConfidence: null };
  const [best, second] = scored;
  if (second && best.score - second.score < 0.08) return { status: "ambiguous", game: null, matchConfidence: best.score };
  return { status: "matched", game: mapIgdbGame(best.candidate), matchConfidence: best.score };
}

async function main() {
  const key = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;
  if (!key || !steamId) {
    const payloads = unavailablePayloads();
    publishPayloads({ ...payloads, achievements: [] });
    console.log("Steam sync skipped: credentials are not configured.");
    return;
  }

  const syncedAt = new Date().toISOString();
  try {
    const [summaryPayload, ownedPayload, recentPayload] = await Promise.all([
      steamGet("/ISteamUser/GetPlayerSummaries/v0002/", { key, steamids: steamId, format: "json" }),
      steamGet("/IPlayerService/GetOwnedGames/v0001/", { key, steamid: steamId, include_appinfo: 1, include_played_free_games: 1, format: "json" }),
      steamGet("/IPlayerService/GetRecentlyPlayedGames/v0001/", { key, steamid: steamId, count: 10, format: "json" }),
    ]);
    const player = summaryPayload?.response?.players?.[0] || {};
    const ownedGames = ownedPayload?.response?.games || [];
    const recentGames = recentPayload?.response?.games || [];
    const recentAppIds = new Set(recentGames.map((game) => Number(game.appid)));
    const localAchievementCache = readLocalAchievementCache();
    const remoteAchievementCache = await loadPreviousSteamCache();
    const combinedAchievementCache = new Map([...remoteAchievementCache, ...localAchievementCache]);
    const usedSlugs = new Set();

    const achievementCandidates = ownedGames
      .slice()
      .sort((a, b) => {
        const aRecent = recentAppIds.has(Number(a.appid)) ? 1 : 0;
        const bRecent = recentAppIds.has(Number(b.appid)) ? 1 : 0;
        return bRecent - aRecent || Number(b.playtime_forever || 0) - Number(a.playtime_forever || 0);
      })
      .slice(0, ACHIEVEMENT_REFRESH_LIMIT);
    const achievementRecords = [];
    const achievementMap = new Map();
    for (const game of achievementCandidates) {
      const record = await fetchAchievementRecord(key, steamId, game.appid);
      if (record) {
        achievementRecords.push(record);
        achievementMap.set(Number(game.appid), record.achievements);
      } else if (combinedAchievementCache.has(Number(game.appid))) {
        achievementMap.set(Number(game.appid), combinedAchievementCache.get(Number(game.appid)));
      }
    }
    for (const [appId, achievements] of combinedAchievementCache.entries()) {
      if (!achievementMap.has(appId)) achievementMap.set(appId, achievements);
    }

    const igdbAuth = await authenticateIgdb().catch((error) => {
      console.warn(`IGDB authentication unavailable for Steam: ${safeError(error)}`);
      return null;
    });
    const igdbCandidates = ownedGames
      .slice()
      .sort((a, b) => Number(b.playtime_forever || 0) - Number(a.playtime_forever || 0))
      .slice(0, 30);
    const igdbMap = new Map();
    for (const game of igdbCandidates) {
      try {
        igdbMap.set(Number(game.appid), await enrichSteamGame(igdbAuth, game));
      } catch (error) {
        console.warn(`IGDB unavailable for Steam app ${game.appid}: ${safeError(error)}`);
        igdbMap.set(Number(game.appid), { status: "igdb-unavailable", game: null, matchConfidence: null });
      }
    }

    const records = ownedGames
      .map((game) => {
        const appId = Number(game.appid);
        const enrichment = igdbMap.get(appId) || { status: igdbAuth ? "not-attempted" : "igdb-skipped", game: null, matchConfidence: null };
        const igdb = enrichment.game;
        const baseSlug = slugify(igdb?.title || game.name, appId);
        const achievements = achievementMap.get(appId) || null;
        const lastPlayed = isoFromUnix(game.rtime_last_played);
        return {
          id: `steam:${appId}`,
          internalGameId: igdb?.igdbId ? `igdb:${igdb.igdbId}` : `steam:${appId}`,
          source: "steam",
          slug: uniqueSlug(baseSlug, usedSlugs, appId),
          appId,
          name: igdb?.title || game.name || `Steam App ${appId}`,
          playtimeMinutes: Number(game.playtime_forever || 0),
          playtimeHours: hours(game.playtime_forever),
          recentPlaytimeMinutes: Number(game.playtime_2weeks || 0),
          recentPlaytimeHours: hours(game.playtime_2weeks),
          iconUrl: imageUrl(appId, game.img_icon_url),
          logoUrl: imageUrl(appId, game.img_logo_url),
          cover: igdb?.cover || null,
          artwork: igdb?.artwork || null,
          lastPlayed,
          recentlyPlayed: recentAppIds.has(appId),
          achievements,
          identities: {
            steam: { appId },
            ...(igdb?.igdbId ? { igdb: { id: igdb.igdbId } } : {}),
          },
          igdb: igdb || null,
          sync: {
            steamUpdatedAt: syncedAt,
            igdbUpdatedAt: igdb ? syncedAt : null,
            enrichmentStatus: enrichment.status,
            matchConfidence: enrichment.matchConfidence,
          },
        };
      })
      .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);

    const recentRecords = recentGames.map((game) => {
      const appId = Number(game.appid);
      const matched = records.find((record) => record.appId === appId);
      return {
        appId,
        source: "steam",
        name: matched?.name || game.name || `Steam App ${appId}`,
        playtimeMinutes: matched?.playtimeMinutes ?? null,
        recentPlaytimeMinutes: Number(game.playtime_2weeks || 0),
        recentPlaytimeHours: hours(game.playtime_2weeks),
        lastPlayed: matched?.lastPlayed || null,
        href: "/personal/gaming",
      };
    });
    const gamesWithAchievementData = records.filter((game) => game.achievements).length;
    const totalAchievementsEarned = records.reduce((sum, game) => sum + Number(game.achievements?.earned || 0), 0);
    const totalAchievementsAvailable = records.reduce((sum, game) => sum + Number(game.achievements?.total || 0), 0);
    const perfectGames = records.filter((game) => game.achievements?.perfect).length;
    const totalPlaytimeMinutes = records.reduce((sum, game) => sum + Number(game.playtimeMinutes || 0), 0);
    const igdbMatched = records.filter((game) => game.sync.enrichmentStatus === "matched").length;
    const igdbAmbiguous = records.filter((game) => game.sync.enrichmentStatus === "ambiguous").length;
    const igdbUnresolved = records.filter((game) => ["unresolved", "igdb-unavailable"].includes(game.sync.enrichmentStatus)).length;

    const profile = {
      source: "steam",
      synchronized: true,
      available: true,
      steamId: player.steamid || steamId,
      personaName: player.personaname || null,
      profileUrl: player.profileurl || null,
      avatar: player.avatarfull || player.avatarmedium || player.avatar || null,
      personaState: player.personastate ?? null,
      visibilityState: player.communityvisibilitystate ?? null,
      lastLogoff: isoFromUnix(player.lastlogoff),
      syncedAt,
    };
    const games = { source: "steam", synchronized: true, available: true, syncedAt, games: records };
    const recent = { source: "steam", synchronized: true, available: true, syncedAt, games: recentRecords };
    const summary = {
      source: "steam",
      synchronized: true,
      available: true,
      status: "connected",
      ownedGames: records.length,
      totalPlaytimeMinutes,
      totalPlaytimeHours: hours(totalPlaytimeMinutes),
      recentlyPlayedCount: recentRecords.length,
      gamesWithAchievementData,
      totalAchievementsEarned,
      totalAchievementsAvailable,
      perfectGames,
      igdbMatched,
      igdbAmbiguous,
      igdbUnresolved,
      achievementCoverageLimited: records.length > achievementCandidates.length,
      achievementRefreshLimit: ACHIEVEMENT_REFRESH_LIMIT,
      lastSyncedAt: syncedAt,
    };

    publishPayloads({ profile, games, recent, summary, achievements: achievementRecords });

    console.log("Steam Sync");
    console.log(`Persona: ${profile.personaName || "Unknown"}`);
    console.log(`Owned games: ${summary.ownedGames}`);
    console.log(`Total playtime: ${summary.totalPlaytimeHours} h`);
    console.log(`Recently played: ${summary.recentlyPlayedCount}`);
    console.log(`Games with achievement data: ${summary.gamesWithAchievementData}`);
    console.log(`Achievements earned: ${summary.totalAchievementsEarned}/${summary.totalAchievementsAvailable}`);
    console.log(`Perfect games: ${summary.perfectGames}`);
    console.log(`IGDB matched: ${summary.igdbMatched}`);
    console.log(`IGDB ambiguous: ${summary.igdbAmbiguous}`);
    console.log(`IGDB unresolved: ${summary.igdbUnresolved}`);
    if (summary.achievementCoverageLimited) {
      console.log(`Achievement coverage limited to refreshed/cached candidates. Refresh limit: ${ACHIEVEMENT_REFRESH_LIMIT}`);
    }
  } catch (error) {
    rmSync(TMP_DIR, { recursive: true, force: true });
    console.error(`Steam sync failed: ${safeError(error)}`);
    if (!existsSync(join(GENERATED_DIR, "summary.json"))) {
      const payloads = unavailablePayloads("Steam sync failed before a generated dataset existed.");
      publishPayloads({ ...payloads, achievements: [] });
      console.error("Safe unavailable Steam placeholders were generated.");
    } else {
      console.error("Last generated Steam dataset was preserved.");
    }
    process.exitCode = 1;
  }
}

main();
