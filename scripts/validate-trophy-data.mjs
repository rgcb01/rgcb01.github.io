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
if (!Array.isArray(gamesPayload.games)) throw new Error("trophy-games.json must contain a games array");

const slugs = new Set();
for (const game of gamesPayload.games) {
  if (!game.slug) throw new Error("Every trophy game needs a slug");
  if (slugs.has(game.slug)) throw new Error(`Duplicate trophy game slug: ${game.slug}`);
  slugs.add(game.slug);
  if (game.sources?.psnTitleId && game.sources?.psnTitleId.includes("token")) throw new Error("Generated data appears to contain sensitive values");
}

if (profile.synchronized && existsSync(detailDir)) {
  for (const file of readdirSync(detailDir).filter((item) => item.endsWith(".json"))) {
    const detail = readJson(join(detailDir, file));
    if (!Array.isArray(detail.trophies)) throw new Error(`${file} must contain a trophies array`);
  }
}

console.log(`Trophy data validation passed. Games: ${gamesPayload.games.length}`);
