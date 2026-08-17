import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  currentlyInto,
  devlogEntries,
  manualActivity,
  milestoneDefinitions,
  personalProfile,
  personalRoadmap,
  playerThoughts,
} from "../src/data/personal.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readJson(relativePath, fallback) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
    return fallback;
  }
}

function isDate(value) {
  return Boolean(value && !Number.isNaN(new Date(value).getTime()));
}

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) fail(`${label} must be non-empty text.`);
}

function validateHref(value, label) {
  if (!value) return;
  if (typeof value !== "string") {
    fail(`${label} must be a string.`);
    return;
  }
  const internal = value.startsWith("/");
  const external = /^https?:\/\//.test(value);
  if (!internal && !external) fail(`${label} must be an internal path or http(s) URL.`);
}

function validateCover(value, label) {
  if (!value) return;
  if (typeof value !== "string") {
    fail(`${label} must be a string.`);
    return;
  }
  if (value.startsWith("/") && !exists(`public${value}`)) fail(`${label} points to missing public asset: ${value}`);
}

function uniqueBy(items, keyFn, label) {
  const seen = new Set();
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) fail(`${label} contains duplicate entry: ${key}`);
    seen.add(key);
  }
}

function validatePersonalProfile() {
  requireText(personalProfile.name, "personalProfile.name");
  requireText(personalProfile.handle, "personalProfile.handle");
  if (!Array.isArray(personalProfile.introLines) || personalProfile.introLines.length < 2) {
    fail("personalProfile.introLines should contain at least two lines.");
  }
  if (personalProfile.currentGameOverride !== null && typeof personalProfile.currentGameOverride !== "string") {
    fail("personalProfile.currentGameOverride must be null or a trophy slug/title id string.");
  }
}

function validateManualActivity() {
  if (!Array.isArray(manualActivity)) fail("manualActivity must be an array.");
  uniqueBy(manualActivity, (item) => `${item.date}-${item.title}`, "manualActivity");
  manualActivity.forEach((event, index) => {
    requireText(event.type, `manualActivity[${index}].type`);
    requireText(event.label, `manualActivity[${index}].label`);
    requireText(event.title, `manualActivity[${index}].title`);
    if (!isDate(event.date)) fail(`manualActivity[${index}].date must be a valid date.`);
    validateHref(event.href, `manualActivity[${index}].href`);
  });
}

function validateCurrentlyInto() {
  for (const category of ["playing", "watching", "reading", "listening"]) {
    const items = currentlyInto[category];
    if (!Array.isArray(items)) {
      fail(`currentlyInto.${category} must be an array.`);
      continue;
    }
    items.forEach((item, index) => {
      requireText(item.title, `currentlyInto.${category}[${index}].title`);
      validateCover(item.cover, `currentlyInto.${category}[${index}].cover`);
    });
  }
}

function validateThoughts() {
  if (!Array.isArray(playerThoughts)) fail("playerThoughts must be an array.");
  uniqueBy(playerThoughts, (item) => `${item.date}-${item.title}`, "playerThoughts");
  playerThoughts.forEach((note, index) => {
    requireText(note.title, `playerThoughts[${index}].title`);
    requireText(note.summary, `playerThoughts[${index}].summary`);
    if (!isDate(note.date)) fail(`playerThoughts[${index}].date must be a valid date.`);
  });
}

function validateDevlog() {
  if (!Array.isArray(devlogEntries) || devlogEntries.length === 0) fail("devlogEntries must contain at least one real build log entry.");
  uniqueBy(devlogEntries, (item) => `${item.date}-${item.project}-${item.title}`, "devlogEntries");
  devlogEntries.forEach((entry, index) => {
    requireText(entry.project, `devlogEntries[${index}].project`);
    requireText(entry.category, `devlogEntries[${index}].category`);
    requireText(entry.title, `devlogEntries[${index}].title`);
    requireText(entry.summary, `devlogEntries[${index}].summary`);
    if (!isDate(entry.date)) fail(`devlogEntries[${index}].date must be a valid date.`);
    if (!Array.isArray(entry.tags)) fail(`devlogEntries[${index}].tags must be an array.`);
    validateHref(entry.optionalLink, `devlogEntries[${index}].optionalLink`);
  });
}

function validateRoadmap() {
  if (!Array.isArray(personalRoadmap) || personalRoadmap.length === 0) fail("personalRoadmap must contain at least one stage.");
  personalRoadmap.forEach((stage, index) => {
    requireText(stage.stage, `personalRoadmap[${index}].stage`);
    requireText(stage.status, `personalRoadmap[${index}].status`);
    if (!Array.isArray(stage.items) || stage.items.length === 0) fail(`personalRoadmap[${index}].items must contain at least one item.`);
  });
}

function validateMilestones() {
  if (!Array.isArray(milestoneDefinitions) || milestoneDefinitions.length === 0) fail("milestoneDefinitions must contain at least one milestone.");
  uniqueBy(milestoneDefinitions, (item) => item.title, "milestoneDefinitions");
  milestoneDefinitions.forEach((milestone, index) => {
    requireText(milestone.title, `milestoneDefinitions[${index}].title`);
    requireText(milestone.type, `milestoneDefinitions[${index}].type`);
    requireText(milestone.description, `milestoneDefinitions[${index}].description`);
    if (!Number.isFinite(Number(milestone.value))) fail(`milestoneDefinitions[${index}].value must be numeric.`);
  });
}

function validateNoStaleCopy() {
  const serialized = JSON.stringify({
    currentlyInto,
    devlogEntries,
    manualActivity,
    milestoneDefinitions,
    personalProfile,
    personalRoadmap,
    playerThoughts,
  });
  const stalePatterns = [
    /manual log placeholder/i,
    /coming soon/i,
    /fake/i,
    /lorem ipsum/i,
    /sample review/i,
    /replace me/i,
  ];
  stalePatterns.forEach((pattern) => {
    if (pattern.test(serialized)) fail(`Personal data contains stale placeholder copy matching ${pattern}.`);
  });
}

function validateCurrentHunt() {
  if (!personalProfile.currentGameOverride) return;
  const trophyData = readJson("public/data/generated/trophy-games.json", { games: [] });
  const games = Array.isArray(trophyData.games) ? trophyData.games : [];
  if (!games.length) {
    warn("currentGameOverride was not checked against PSN games because local generated data is empty.");
    return;
  }
  const found = games.some((game) => game.slug === personalProfile.currentGameOverride || game.sources?.psnTitleId === personalProfile.currentGameOverride);
  if (!found) fail("personalProfile.currentGameOverride does not match a generated trophy game.");
}

function validateRoutes() {
  const requiredRoutes = [
    "/personal",
    "/personal/gaming",
    "/personal/trophies",
    "/personal/activity",
    "/personal/media",
    "/personal/thoughts",
    "/personal/builds",
    "/personal/system",
  ];
  const app = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
  requiredRoutes.forEach((route) => {
    if (!app.includes(route)) fail(`Missing personal route in src/App.jsx: ${route}`);
  });
}

validatePersonalProfile();
validateManualActivity();
validateCurrentlyInto();
validateThoughts();
validateDevlog();
validateRoadmap();
validateMilestones();
validateNoStaleCopy();
validateCurrentHunt();
validateRoutes();

warnings.forEach((message) => console.warn(`Warning: ${message}`));

if (errors.length) {
  console.error("Personal data validation failed:");
  errors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Personal data validation passed.");
