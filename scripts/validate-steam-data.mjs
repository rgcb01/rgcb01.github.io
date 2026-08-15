import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const steamDir = join("public", "data", "generated", "steam");
const requiredFiles = ["profile.json", "games.json", "recently-played.json", "summary.json"];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function containsForbiddenSecretMarker(value) {
  const forbiddenKeyPattern = /apiKey|accessToken|refreshToken|clientSecret|client_secret|Authorization|STEAM_API_KEY/i;
  const forbiddenStringPattern = /Bearer\s+[A-Za-z0-9._-]{20,}|key=[A-Za-z0-9_-]{20,}/i;
  if (Array.isArray(value)) return value.some((item) => containsForbiddenSecretMarker(item));
  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, item]) => forbiddenKeyPattern.test(key) || containsForbiddenSecretMarker(item));
  }
  return typeof value === "string" && forbiddenStringPattern.test(value);
}

for (const file of requiredFiles) {
  const path = join(steamDir, file);
  assert(existsSync(path), `${path} is missing`);
}

const profile = readJson(join(steamDir, "profile.json"));
const gamesPayload = readJson(join(steamDir, "games.json"));
const recentPayload = readJson(join(steamDir, "recently-played.json"));
const summary = readJson(join(steamDir, "summary.json"));

assert(profile.source === "steam", "profile.json must be a Steam profile payload");
assert(gamesPayload.source === "steam", "games.json must be a Steam games payload");
assert(recentPayload.source === "steam", "recently-played.json must be a Steam recent payload");
assert(summary.source === "steam", "summary.json must be a Steam summary payload");
assert(Array.isArray(gamesPayload.games), "games.json must contain a games array");
assert(Array.isArray(recentPayload.games), "recently-played.json must contain a games array");
assert(!containsForbiddenSecretMarker([profile, gamesPayload, recentPayload, summary]), "Generated Steam JSON contains a forbidden secret/token marker");

const appIds = new Set();
let totalPlaytimeMinutes = 0;
let gamesWithAchievementData = 0;
let earned = 0;
let available = 0;
let perfectGames = 0;

for (const game of gamesPayload.games) {
  assert(game.source === "steam", "Every Steam game must identify its source");
  assert(Number.isInteger(Number(game.appId)) && Number(game.appId) > 0, `Invalid Steam app ID for ${game.name || "unknown game"}`);
  assert(!appIds.has(Number(game.appId)), `Duplicate Steam app ID: ${game.appId}`);
  appIds.add(Number(game.appId));
  assert(typeof game.name === "string" && game.name.trim(), `Steam game ${game.appId} is missing a name`);
  assert(Number.isFinite(Number(game.playtimeMinutes)) && Number(game.playtimeMinutes) >= 0, `Invalid playtime for ${game.name}`);
  assert(Number.isFinite(Number(game.playtimeHours)) && Number(game.playtimeHours) >= 0, `Invalid playtime hours for ${game.name}`);
  totalPlaytimeMinutes += Number(game.playtimeMinutes || 0);
  if (game.achievements !== null) {
    const achievements = game.achievements;
    assert(Number.isInteger(Number(achievements.earned)) && Number(achievements.earned) >= 0, `Invalid earned achievements for ${game.name}`);
    assert(Number.isInteger(Number(achievements.total)) && Number(achievements.total) >= 0, `Invalid total achievements for ${game.name}`);
    assert(Number(achievements.earned) <= Number(achievements.total), `Earned achievements exceed total for ${game.name}`);
    assert(achievements.percent === null || (Number(achievements.percent) >= 0 && Number(achievements.percent) <= 100), `Invalid achievement percent for ${game.name}`);
    gamesWithAchievementData += 1;
    earned += Number(achievements.earned);
    available += Number(achievements.total);
    if (achievements.perfect) perfectGames += 1;
  }
  for (const url of [game.iconUrl, game.logoUrl, game.cover, game.artwork].filter(Boolean)) {
    assert(/^https:\/\//.test(url) && !/key=|token|bearer/i.test(url), `Unsafe image URL for ${game.name}`);
  }
}

assert(Number(summary.ownedGames || 0) === gamesPayload.games.length, "Steam owned game count does not match games.json");
assert(Number(summary.totalPlaytimeMinutes || 0) === totalPlaytimeMinutes, "Steam total playtime does not match games.json");
assert(Number(summary.recentlyPlayedCount || 0) === recentPayload.games.length, "Steam recently played count does not match recently-played.json");
assert(Number(summary.gamesWithAchievementData || 0) === gamesWithAchievementData, "Steam achievement game count does not match games.json");
assert(Number(summary.totalAchievementsEarned || 0) === earned, "Steam earned achievement total does not match games.json");
assert(Number(summary.totalAchievementsAvailable || 0) === available, "Steam available achievement total does not match games.json");
assert(Number(summary.perfectGames || 0) === perfectGames, "Steam perfect game count does not match games.json");

const achievementDir = join(steamDir, "achievements");
if (existsSync(achievementDir)) {
  for (const file of readdirSync(achievementDir).filter((item) => item.endsWith(".json"))) {
    const detail = readJson(join(achievementDir, file));
    assert(Number.isInteger(Number(detail.appId)) && Number(detail.appId) > 0, `${file} has an invalid app ID`);
    assert(!containsForbiddenSecretMarker(detail), `${file} contains a forbidden secret/token marker`);
    assert(Array.isArray(detail.items), `${file} must contain achievement items`);
  }
}

console.log(`Steam data validation passed. Games: ${gamesPayload.games.length}`);
