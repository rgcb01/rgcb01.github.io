import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { mediaLibrary } from "../src/data/personal.js";

const LASTFM_DIR = join("public", "data", "generated", "lastfm");
const MEDIA_DIR = join("public", "data", "generated", "media");
const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const OPEN_LIBRARY_BASE = "https://openlibrary.org";
const USER_AGENT = "rgcb01.github.io media sync (https://github.com/rgcb01/rgcb01.github.io)";
const RETRY_DELAYS_MS = [1000, 2400, 5200];
const RATE_LIMIT_MS = 350;
let lastRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeError(error) {
  return String(error?.message || error)
    .replace(/api_key=([^&\s]+)/gi, "api_key=[redacted]")
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

async function boundedFetch(url, options = {}) {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < RATE_LIMIT_MS) await sleep(RATE_LIMIT_MS - elapsed);
    lastRequestAt = Date.now();

    const response = await fetch(url, options);
    if (response.ok) return response;
    if ([429, 500, 502, 503, 504].includes(response.status) && attempt < RETRY_DELAYS_MS.length) {
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }
    throw new Error(`Request failed with status ${response.status}`);
  }
  throw new Error("Request failed after retries");
}

function imageFromLastfm(images = []) {
  const image = images.slice().reverse().find((item) => item?.["#text"]);
  return image?.["#text"] || null;
}

function isoFromUnix(value) {
  const numeric = Number(value || 0);
  return numeric > 0 ? new Date(numeric * 1000).toISOString() : null;
}

function normalizeLastfmTrack(track) {
  const nowPlaying = track?.["@attr"]?.nowplaying === "true";
  return {
    source: "lastfm",
    name: track?.name || null,
    artist: track?.artist?.["#text"] || track?.artist?.name || null,
    album: track?.album?.["#text"] || null,
    url: track?.url || null,
    image: imageFromLastfm(track?.image || []),
    nowPlaying,
    date: nowPlaying ? new Date().toISOString() : isoFromUnix(track?.date?.uts),
  };
}

function normalizeLastfmArtist(artist) {
  return {
    source: "lastfm",
    name: artist?.name || null,
    playcount: Number(artist?.playcount || 0),
    url: artist?.url || null,
    image: imageFromLastfm(artist?.image || []),
  };
}

function normalizeLastfmAlbum(album) {
  return {
    source: "lastfm",
    name: album?.name || null,
    artist: album?.artist?.name || album?.artist?.["#text"] || null,
    playcount: Number(album?.playcount || 0),
    url: album?.url || null,
    image: imageFromLastfm(album?.image || []),
  };
}

async function lastfmGet(method, params = {}) {
  const url = new URL(LASTFM_BASE);
  url.searchParams.set("method", method);
  url.searchParams.set("api_key", process.env.LASTFM_API_KEY);
  url.searchParams.set("user", process.env.LASTFM_USERNAME);
  url.searchParams.set("format", "json");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await boundedFetch(url);
  const payload = await response.json();
  if (payload?.error) throw new Error(`Last.fm ${method} failed: ${payload.message || payload.error}`);
  return payload;
}

async function syncLastfm() {
  mkdirSync(LASTFM_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  if (!process.env.LASTFM_API_KEY || !process.env.LASTFM_USERNAME) {
    const reason = "Last.fm credentials are not configured.";
    atomicWriteJson(join(LASTFM_DIR, "profile.json"), { source: "lastfm", synchronized: false, available: false, generatedAt, reason });
    atomicWriteJson(join(LASTFM_DIR, "recent-tracks.json"), { source: "lastfm", synchronized: false, available: false, generatedAt, tracks: [], reason });
    atomicWriteJson(join(LASTFM_DIR, "top-artists.json"), { source: "lastfm", synchronized: false, available: false, period: "1month", generatedAt, artists: [], reason });
    atomicWriteJson(join(LASTFM_DIR, "top-albums.json"), { source: "lastfm", synchronized: false, available: false, period: "1month", generatedAt, albums: [], reason });
    atomicWriteJson(join(LASTFM_DIR, "summary.json"), { source: "lastfm", synchronized: false, available: false, username: null, status: "unavailable", generatedAt, reason });
    console.log("Last.fm sync skipped: credentials are not configured.");
    return;
  }

  try {
    const info = await lastfmGet("user.getInfo");
    const recent = await lastfmGet("user.getRecentTracks", { limit: "10", extended: "0" });
    const artists = await lastfmGet("user.getTopArtists", { period: "1month", limit: "8" });
    const albums = await lastfmGet("user.getTopAlbums", { period: "1month", limit: "6" });
    const user = info.user || {};
    const tracks = (recent.recenttracks?.track || []).map(normalizeLastfmTrack).filter((track) => track.name && track.artist);
    const topArtists = (artists.topartists?.artist || []).map(normalizeLastfmArtist).filter((artist) => artist.name);
    const topAlbums = (albums.topalbums?.album || []).map(normalizeLastfmAlbum).filter((album) => album.name);
    const profile = {
      source: "lastfm",
      synchronized: true,
      available: true,
      username: user.name || process.env.LASTFM_USERNAME,
      realName: user.realname || null,
      url: user.url || null,
      country: user.country || null,
      playcount: Number(user.playcount || 0),
      registeredAt: isoFromUnix(user.registered?.unixtime),
      syncedAt: generatedAt,
    };
    atomicWriteJson(join(LASTFM_DIR, "profile.json"), profile);
    atomicWriteJson(join(LASTFM_DIR, "recent-tracks.json"), { source: "lastfm", synchronized: true, available: true, syncedAt: generatedAt, tracks });
    atomicWriteJson(join(LASTFM_DIR, "top-artists.json"), { source: "lastfm", synchronized: true, available: true, period: "1month", syncedAt: generatedAt, artists: topArtists });
    atomicWriteJson(join(LASTFM_DIR, "top-albums.json"), { source: "lastfm", synchronized: true, available: true, period: "1month", syncedAt: generatedAt, albums: topAlbums });
    atomicWriteJson(join(LASTFM_DIR, "summary.json"), {
      source: "lastfm",
      synchronized: true,
      available: true,
      status: "connected",
      username: profile.username,
      playcount: profile.playcount,
      recentTrackCount: tracks.length,
      topArtist: topArtists[0]?.name || null,
      topAlbum: topAlbums[0]?.name || null,
      nowPlaying: tracks.some((track) => track.nowPlaying),
      lastSyncedAt: generatedAt,
    });
    console.log(`Last.fm sync complete for ${profile.username}. Recent tracks: ${tracks.length}`);
  } catch (error) {
    console.error(`Last.fm sync failed: ${safeError(error)}`);
    if (!existsSync(join(LASTFM_DIR, "summary.json"))) await syncLastfmUnavailable("Last.fm sync failed before a generated dataset existed.");
    process.exitCode = 1;
  }
}

async function syncLastfmUnavailable(reason) {
  const generatedAt = new Date().toISOString();
  atomicWriteJson(join(LASTFM_DIR, "profile.json"), { source: "lastfm", synchronized: false, available: false, generatedAt, reason });
  atomicWriteJson(join(LASTFM_DIR, "recent-tracks.json"), { source: "lastfm", synchronized: false, available: false, generatedAt, tracks: [], reason });
  atomicWriteJson(join(LASTFM_DIR, "top-artists.json"), { source: "lastfm", synchronized: false, available: false, period: "1month", generatedAt, artists: [], reason });
  atomicWriteJson(join(LASTFM_DIR, "top-albums.json"), { source: "lastfm", synchronized: false, available: false, period: "1month", generatedAt, albums: [], reason });
  atomicWriteJson(join(LASTFM_DIR, "summary.json"), { source: "lastfm", synchronized: false, available: false, username: null, status: "unavailable", generatedAt, reason });
}

function tmdbImage(path, size) {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

async function tmdbGet(path) {
  const response = await boundedFetch(`${TMDB_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`,
      Accept: "application/json",
    },
  });
  return response.json();
}

function normalizeTmdbMetadata(type, payload) {
  return {
    source: "tmdb",
    kind: type,
    title: type === "movie" ? payload.title || payload.original_title || null : payload.name || payload.original_name || null,
    poster: tmdbImage(payload.poster_path, "w342"),
    backdrop: tmdbImage(payload.backdrop_path, "w780"),
    releaseDate: type === "movie" ? payload.release_date || null : null,
    firstAirDate: type === "tv" ? payload.first_air_date || null : null,
    genres: (payload.genres || []).map((genre) => genre.name).filter(Boolean),
    overview: payload.overview || null,
    runtime: type === "movie" ? payload.runtime || null : null,
    seasonCount: type === "tv" ? payload.number_of_seasons || null : null,
    episodeCount: type === "tv" ? payload.number_of_episodes || null : null,
  };
}

function manualWatchingItems() {
  return (mediaLibrary.watching || []).filter((item) => item.tmdbId && ["movie", "tv"].includes(item.type));
}

function fallbackTmdbItem(item, generatedAt, reason) {
  return {
    type: item.type,
    tmdbId: Number(item.tmdbId),
    metadata: item.title ? { source: "manual", kind: item.type, title: item.title, poster: item.cover || null } : null,
    manual: item,
    sync: { source: "tmdb", synchronized: false, available: false, generatedAt, reason },
  };
}

async function syncTmdb() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  const entries = manualWatchingItems();
  const movieItems = [];
  const tvItems = [];
  if (!process.env.TMDB_READ_ACCESS_TOKEN) {
    const reason = "TMDB token is not configured.";
    for (const item of entries) {
      const record = fallbackTmdbItem(item, generatedAt, reason);
      if (item.type === "movie") movieItems.push(record);
      else tvItems.push(record);
    }
    atomicWriteJson(join(MEDIA_DIR, "movies.json"), { source: "tmdb", synchronized: false, available: false, generatedAt, items: movieItems, reason });
    atomicWriteJson(join(MEDIA_DIR, "tv.json"), { source: "tmdb", synchronized: false, available: false, generatedAt, items: tvItems, reason });
    console.log("TMDB sync skipped: token is not configured.");
    return;
  }

  try {
    for (const item of entries) {
      const payload = await tmdbGet(`/${item.type}/${encodeURIComponent(item.tmdbId)}?language=en-US`);
      const record = {
        type: item.type,
        tmdbId: Number(item.tmdbId),
        metadata: normalizeTmdbMetadata(item.type, payload),
        manual: item,
        sync: { source: "tmdb", synchronized: true, available: true, syncedAt: generatedAt },
      };
      if (item.type === "movie") movieItems.push(record);
      else tvItems.push(record);
    }
    atomicWriteJson(join(MEDIA_DIR, "movies.json"), { source: "tmdb", synchronized: true, available: true, syncedAt: generatedAt, items: movieItems });
    atomicWriteJson(join(MEDIA_DIR, "tv.json"), { source: "tmdb", synchronized: true, available: true, syncedAt: generatedAt, items: tvItems });
    console.log(`TMDB sync complete. Movies: ${movieItems.length}. TV: ${tvItems.length}.`);
  } catch (error) {
    console.error(`TMDB sync failed: ${safeError(error)}`);
    if (!existsSync(join(MEDIA_DIR, "movies.json")) || !existsSync(join(MEDIA_DIR, "tv.json"))) {
      atomicWriteJson(join(MEDIA_DIR, "movies.json"), { source: "tmdb", synchronized: false, available: false, generatedAt, items: [], reason: "TMDB sync failed before a generated dataset existed." });
      atomicWriteJson(join(MEDIA_DIR, "tv.json"), { source: "tmdb", synchronized: false, available: false, generatedAt, items: [], reason: "TMDB sync failed before a generated dataset existed." });
    }
    process.exitCode = 1;
  }
}

function manualReadingItems() {
  return mediaLibrary.reading || [];
}

function openLibraryCover({ coverId, isbn }) {
  if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
  if (isbn) return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-M.jpg`;
  return null;
}

async function openLibraryWork(item) {
  if (item.openLibraryKey) {
    const key = item.openLibraryKey.startsWith("/") ? item.openLibraryKey : `/works/${item.openLibraryKey}`;
    const response = await boundedFetch(`${OPEN_LIBRARY_BASE}${key}.json`, { headers: { "User-Agent": USER_AGENT } });
    return response.json();
  }
  if (item.isbn) {
    const response = await boundedFetch(`${OPEN_LIBRARY_BASE}/isbn/${encodeURIComponent(item.isbn)}.json`, { headers: { "User-Agent": USER_AGENT } });
    return response.json();
  }
  return null;
}

async function authorName(authorRef) {
  const key = authorRef?.author?.key || authorRef?.key;
  if (!key) return null;
  try {
    const response = await boundedFetch(`${OPEN_LIBRARY_BASE}${key}.json`, { headers: { "User-Agent": USER_AGENT } });
    const payload = await response.json();
    return payload.name || null;
  } catch {
    return null;
  }
}

async function syncOpenLibrary() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  const items = [];
  try {
    for (const item of manualReadingItems()) {
      const work = await openLibraryWork(item);
      const author = work?.authors?.[0] ? await authorName(work.authors[0]) : item.author || null;
      items.push({
        openLibraryKey: item.openLibraryKey || work?.works?.[0]?.key || null,
        isbn: item.isbn || work?.isbn_13?.[0] || work?.isbn_10?.[0] || null,
        metadata: work ? {
          source: "open-library",
          title: work.title || item.title || null,
          author,
          firstPublishYear: work.first_publish_date || work.publish_date || item.year || null,
          cover: openLibraryCover({ coverId: work.covers?.[0], isbn: item.isbn || work.isbn_13?.[0] || work.isbn_10?.[0] }),
        } : null,
        manual: item,
        sync: { source: "open-library", synchronized: Boolean(work), available: Boolean(work), syncedAt: generatedAt },
      });
    }
    atomicWriteJson(join(MEDIA_DIR, "books.json"), { source: "open-library", synchronized: true, available: true, syncedAt: generatedAt, items });
    console.log(`Open Library sync complete. Books: ${items.length}.`);
  } catch (error) {
    console.error(`Open Library sync failed: ${safeError(error)}`);
    if (!existsSync(join(MEDIA_DIR, "books.json"))) {
      atomicWriteJson(join(MEDIA_DIR, "books.json"), { source: "open-library", synchronized: false, available: false, generatedAt, items: [], reason: "Open Library sync failed before a generated dataset existed." });
    }
    process.exitCode = 1;
  }
}

function assertSafeGenerated() {
  const payloads = [
    readJsonIfExists(join(LASTFM_DIR, "profile.json"), {}),
    readJsonIfExists(join(LASTFM_DIR, "recent-tracks.json"), {}),
    readJsonIfExists(join(LASTFM_DIR, "top-artists.json"), {}),
    readJsonIfExists(join(LASTFM_DIR, "top-albums.json"), {}),
    readJsonIfExists(join(LASTFM_DIR, "summary.json"), {}),
    readJsonIfExists(join(MEDIA_DIR, "movies.json"), {}),
    readJsonIfExists(join(MEDIA_DIR, "tv.json"), {}),
    readJsonIfExists(join(MEDIA_DIR, "books.json"), {}),
  ];
  const serialized = JSON.stringify(payloads);
  const forbidden = ["LASTFM_API_KEY", "TMDB_READ_ACCESS_TOKEN", "PSN_NPSSO", "STEAM_API_KEY", "IGDB_CLIENT_SECRET", "Bearer "];
  for (const term of forbidden) {
    if (serialized.includes(term)) throw new Error(`Generated media data contains forbidden token marker: ${term}`);
  }
  if (/api_key=[A-Za-z0-9_-]{20,}/i.test(serialized)) throw new Error("Generated media data contains an API key query marker.");
}

await syncLastfm();
await syncTmdb();
await syncOpenLibrary();
assertSafeGenerated();
