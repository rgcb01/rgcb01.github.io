import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const generatedDir = join("public", "data", "generated");
const profilePath = join(generatedDir, "psn-profile.json");
const gamesPath = join(generatedDir, "trophy-games.json");
const detailDir = join(generatedDir, "trophy-details");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

for (const path of [profilePath, gamesPath]) {
  if (!existsSync(path)) throw new Error(`${path} is missing`);
}

const profile = readJson(profilePath);
const gamesPayload = readJson(gamesPath);
const forbiddenPattern = /npsso|accessToken|refreshToken|clientSecret|client_secret|Authorization|Bearer/i;
if (!Array.isArray(gamesPayload.games)) throw new Error("trophy-games.json must contain a games array");
if (forbiddenPattern.test(JSON.stringify([profile, gamesPayload]))) {
  throw new Error("Generated trophy summary contains a forbidden secret/token marker");
}

const slugs = new Set();
const ids = new Set();
for (const game of gamesPayload.games) {
  if (!game.id) throw new Error("Every trophy game needs an id");
  if (ids.has(game.id)) throw new Error(`Duplicate trophy game id: ${game.id}`);
  ids.add(game.id);
  if (!game.slug) throw new Error("Every trophy game needs a slug");
  if (slugs.has(game.slug)) throw new Error(`Duplicate trophy game slug: ${game.slug}`);
  slugs.add(game.slug);
  if (game.sources?.psnTitleId && game.sources?.psnTitleId.includes("token")) throw new Error("Generated data appears to contain sensitive values");
  if (game.sources?.igdbId != null && (!Number.isInteger(Number(game.sources.igdbId)) || Number(game.sources.igdbId) <= 0)) {
    throw new Error(`Invalid IGDB ID for ${game.slug}`);
  }
  for (const imageUrl of [game.game?.cover, game.game?.artwork, ...(game.game?.screenshots || [])].filter(Boolean)) {
    if (!/^https:\/\//.test(imageUrl) || /npsso|token|bearer/i.test(imageUrl)) {
      throw new Error(`Unexpected image URL for ${game.slug}`);
    }
  }
}

if (profile.synchronized && existsSync(detailDir)) {
  for (const file of readdirSync(detailDir).filter((item) => item.endsWith(".json"))) {
    const detail = readJson(join(detailDir, file));
    if (forbiddenPattern.test(JSON.stringify(detail))) {
      throw new Error(`${file} contains a forbidden secret/token marker`);
    }
    if (!Array.isArray(detail.trophies)) throw new Error(`${file} must contain a trophies array`);
    for (const trophy of detail.trophies) {
      if (trophy.id === undefined || trophy.id === null) throw new Error(`${file} contains a trophy without an id`);
      if (!["bronze", "silver", "gold", "platinum", null].includes(trophy.type)) throw new Error(`${file} contains an unexpected trophy type`);
      if (typeof trophy.earned !== "boolean") throw new Error(`${file} contains a trophy without earned state`);
    }
  }
}

console.log(`Trophy data validation passed. Games: ${gamesPayload.games.length}`);
