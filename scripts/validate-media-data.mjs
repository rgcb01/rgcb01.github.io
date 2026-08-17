import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { currentlyInto, mediaLibrary } from "../src/data/personal.js";

const requiredFiles = [
  join("public", "data", "generated", "lastfm", "profile.json"),
  join("public", "data", "generated", "lastfm", "recent-tracks.json"),
  join("public", "data", "generated", "lastfm", "top-artists.json"),
  join("public", "data", "generated", "lastfm", "top-albums.json"),
  join("public", "data", "generated", "lastfm", "summary.json"),
  join("public", "data", "generated", "media", "movies.json"),
  join("public", "data", "generated", "media", "tv.json"),
  join("public", "data", "generated", "media", "books.json"),
];
const watchingStatuses = new Set(["watching", "watched", "finished", "paused", "planned", "dropped"]);
const readingStatuses = new Set(["reading", "finished", "read", "paused", "planned", "dropped"]);
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`);
    return null;
  }
}

function isSafeUrl(value, label) {
  if (!value) return;
  if (typeof value !== "string") {
    fail(`${label} must be a string URL.`);
    return;
  }
  if (!/^https?:\/\//.test(value) && !value.startsWith("/")) fail(`${label} must be http(s) or an internal path.`);
  if (/api_key=|token=|bearer|client_secret|access_token/i.test(value)) fail(`${label} appears to contain a secret marker.`);
}

function rating(value, label) {
  if (value == null) return;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 10) fail(`${label} rating must be between 0 and 10.`);
}

function progress(value, label) {
  if (value == null || typeof value === "string") return;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) fail(`${label} progress must be text or a 0-100 number.`);
}

function noSecrets(value, label) {
  const serialized = JSON.stringify(value);
  const markers = [
    /LASTFM_API_KEY/i,
    /TMDB_READ_ACCESS_TOKEN/i,
    /PSN_NPSSO/i,
    /STEAM_API_KEY/i,
    /IGDB_CLIENT_SECRET/i,
    /Bearer\s+[A-Za-z0-9._-]{20,}/i,
    /api_key=[A-Za-z0-9_-]{20,}/i,
    /client_secret/i,
    /access_token/i,
  ];
  for (const marker of markers) {
    if (marker.test(serialized)) fail(`${label} contains a forbidden secret marker.`);
  }
}

function validateManualWatching() {
  if (!Array.isArray(mediaLibrary.watching)) fail("mediaLibrary.watching must be an array.");
  for (const [index, item] of (mediaLibrary.watching || []).entries()) {
    const label = `mediaLibrary.watching[${index}]`;
    if (!["movie", "tv"].includes(item.type)) fail(`${label}.type must be movie or tv.`);
    if (item.tmdbId != null && (!Number.isInteger(Number(item.tmdbId)) || Number(item.tmdbId) <= 0)) fail(`${label}.tmdbId must be a positive integer.`);
    if (item.status && !watchingStatuses.has(item.status)) fail(`${label}.status is not supported.`);
    rating(item.rating, label);
    progress(item.progress, label);
  }
}

function validateManualReading() {
  if (!Array.isArray(mediaLibrary.reading)) fail("mediaLibrary.reading must be an array.");
  for (const [index, item] of (mediaLibrary.reading || []).entries()) {
    const label = `mediaLibrary.reading[${index}]`;
    if (!item.openLibraryKey && !item.isbn && !item.title) fail(`${label} needs openLibraryKey, isbn or a manual title fallback.`);
    if (item.openLibraryKey && !/^\/?works\/OL\d+W$|^OL\d+W$/.test(item.openLibraryKey)) fail(`${label}.openLibraryKey should look like OL123W or /works/OL123W.`);
    if (item.isbn && !/^[0-9Xx-]{10,17}$/.test(item.isbn)) fail(`${label}.isbn does not look like an ISBN.`);
    if (item.status && !readingStatuses.has(item.status)) fail(`${label}.status is not supported.`);
    rating(item.rating, label);
    progress(item.progress, label);
  }
}

function validateLegacyCurrentlyInto() {
  for (const category of ["watching", "reading", "listening"]) {
    if (!Array.isArray(currentlyInto[category])) fail(`currentlyInto.${category} must be an array.`);
    for (const [index, item] of (currentlyInto[category] || []).entries()) {
      if (!item.title || typeof item.title !== "string") fail(`currentlyInto.${category}[${index}].title is required.`);
      isSafeUrl(item.cover, `currentlyInto.${category}[${index}].cover`);
    }
  }
}

function validateLastfm(payloads) {
  const [profile, recent, artists, albums, summary] = payloads;
  for (const payload of payloads) {
    if (payload.source !== "lastfm") fail("Every Last.fm generated payload must use source=lastfm.");
    noSecrets(payload, "Last.fm generated JSON");
  }
  if (!Array.isArray(recent.tracks)) fail("recent-tracks.json must contain tracks array.");
  for (const [index, track] of (recent.tracks || []).entries()) {
    if (track.name != null && typeof track.name !== "string") fail(`Last.fm track ${index} has invalid name.`);
    if (track.artist != null && typeof track.artist !== "string") fail(`Last.fm track ${index} has invalid artist.`);
    isSafeUrl(track.url, `Last.fm track ${index}.url`);
    isSafeUrl(track.image, `Last.fm track ${index}.image`);
  }
  if (!Array.isArray(artists.artists)) fail("top-artists.json must contain artists array.");
  if (!Array.isArray(albums.albums)) fail("top-albums.json must contain albums array.");
  if (summary.username != null && typeof summary.username !== "string") fail("Last.fm summary username must be text.");
  if (profile.playcount != null && Number(profile.playcount) < 0) fail("Last.fm profile playcount must be non-negative.");
}

function validateTmdb(payload, expectedType) {
  if (payload.source !== "tmdb") fail(`${expectedType}.json must use source=tmdb.`);
  if (!Array.isArray(payload.items)) fail(`${expectedType}.json must contain items array.`);
  noSecrets(payload, `${expectedType}.json`);
  for (const [index, item] of (payload.items || []).entries()) {
    if (item.type !== expectedType) fail(`${expectedType}[${index}].type must be ${expectedType}.`);
    if (!Number.isInteger(Number(item.tmdbId)) || Number(item.tmdbId) <= 0) fail(`${expectedType}[${index}].tmdbId must be a positive integer.`);
    isSafeUrl(item.metadata?.poster, `${expectedType}[${index}].metadata.poster`);
    isSafeUrl(item.metadata?.backdrop, `${expectedType}[${index}].metadata.backdrop`);
    rating(item.manual?.rating, `${expectedType}[${index}].manual`);
  }
}

function validateBooks(payload) {
  if (payload.source !== "open-library") fail("books.json must use source=open-library.");
  if (!Array.isArray(payload.items)) fail("books.json must contain items array.");
  noSecrets(payload, "books.json");
  for (const [index, item] of (payload.items || []).entries()) {
    if (!item.openLibraryKey && !item.isbn && !item.manual?.title) fail(`books[${index}] needs a stable identity or manual title.`);
    isSafeUrl(item.metadata?.cover, `books[${index}].metadata.cover`);
    rating(item.manual?.rating, `books[${index}].manual`);
    progress(item.manual?.progress, `books[${index}].manual`);
  }
}

validateManualWatching();
validateManualReading();
validateLegacyCurrentlyInto();

const payloads = [];
for (const file of requiredFiles) {
  if (!existsSync(file)) {
    fail(`${file} is missing. Run npm run sync:media first.`);
    continue;
  }
  payloads.push(readJson(file));
}

if (payloads.length === requiredFiles.length) {
  validateLastfm(payloads.slice(0, 5));
  validateTmdb(payloads[5], "movie");
  validateTmdb(payloads[6], "tv");
  validateBooks(payloads[7]);
}

if (errors.length) {
  console.error("Media data validation failed:");
  errors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Media data validation passed.");
