import { useEffect, useMemo, useState } from "react";
import { loadJson } from "./trophies/trophyUtils.js";

function dateValue(value) {
  return value ? new Date(value).getTime() : 0;
}

function yearFromDate(value) {
  return value ? new Date(value).getFullYear() : null;
}

function sortByDate(items) {
  return items.slice().sort((a, b) => dateValue(b.date || b.manual?.date || b.manual?.finishedDate) - dateValue(a.date || a.manual?.date || a.manual?.finishedDate));
}

function musicTrackTitle(track) {
  return [track?.artist, track?.name].filter(Boolean).join(" - ") || "Recent track";
}

function mediaTitle(item) {
  return item?.metadata?.title || item?.manual?.title || "Untitled";
}

function mediaCover(item) {
  return item?.metadata?.poster || item?.metadata?.cover || item?.manual?.cover || "";
}

function normalizeMusic({ profile, recentTracks, topArtists, topAlbums, summary }) {
  const tracks = recentTracks?.tracks || [];
  const nowPlaying = tracks.find((track) => track.nowPlaying) || null;
  const lastTrack = nowPlaying || tracks[0] || null;
  return {
    profile: profile || null,
    connected: Boolean(summary?.available && summary?.synchronized),
    username: summary?.username || profile?.username || null,
    nowPlaying,
    lastTrack,
    recentTracks: tracks,
    topArtists: topArtists?.artists || [],
    topAlbums: topAlbums?.albums || [],
    summary: summary || null,
  };
}

function normalizeWatching(moviesPayload, tvPayload, legacyWatching = []) {
  const generated = [
    ...(moviesPayload?.items || []),
    ...(tvPayload?.items || []),
  ].map((item) => ({
    ...item,
    title: mediaTitle(item),
    cover: mediaCover(item),
    year: yearFromDate(item.metadata?.releaseDate || item.metadata?.firstAirDate),
    source: "TMDB",
  }));

  const legacy = legacyWatching.map((item) => ({
    type: item.type || "local",
    title: item.title,
    cover: item.cover,
    year: item.year || null,
    source: "LOCAL",
    manual: { ...item, status: item.status || "watching" },
    metadata: null,
  }));

  return [...generated, ...legacy];
}

function normalizeReading(booksPayload, legacyReading = []) {
  const generated = (booksPayload?.items || []).map((item) => ({
    ...item,
    title: mediaTitle(item),
    cover: mediaCover(item),
    author: item.metadata?.author || item.manual?.author || "",
    year: item.metadata?.firstPublishYear || item.manual?.year || null,
    source: "OPEN LIBRARY",
  }));

  const legacy = legacyReading.map((item) => ({
    title: item.title,
    cover: item.cover,
    author: item.author || "",
    year: item.year || null,
    source: "LOCAL",
    manual: { ...item, status: item.status || "reading" },
    metadata: null,
  }));

  return [...generated, ...legacy];
}

function currentWatchingItem(watching) {
  return watching.find((item) => item.manual?.status === "watching") || null;
}

function currentReadingItem(reading) {
  return reading.find((item) => item.manual?.status === "reading") || null;
}

function listeningItem(music) {
  const track = music.lastTrack;
  if (!track) return null;
  return {
    category: "Listening",
    title: musicTrackTitle(track),
    detail: track.nowPlaying ? "Now Playing" : "Last listened",
    cover: track.image || "",
    href: "/personal/media",
  };
}

function mediaActivities({ music, watching, reading }) {
  const activities = [];
  if (music.lastTrack?.date) {
    activities.push({
      type: "media",
      label: music.lastTrack.nowPlaying ? "NOW PLAYING" : "LAST LISTENED",
      title: musicTrackTitle(music.lastTrack),
      detail: music.lastTrack.album || "Last.fm recent track",
      date: music.lastTrack.date,
      href: "/personal/media",
      source: "LAST.FM",
    });
  }

  for (const item of watching.filter((entry) => ["watched", "finished"].includes(entry.manual?.status))) {
    if (!item.manual?.date && !item.manual?.finishedDate) continue;
    activities.push({
      type: "media",
      label: item.type === "tv" ? "TV WATCHED" : "MOVIE WATCHED",
      title: mediaTitle(item),
      detail: item.manual?.rating != null ? `Rating ${item.manual.rating}/10` : item.manual?.progress || "Manual media entry",
      date: item.manual?.finishedDate || item.manual?.date,
      href: "/personal/media",
      source: item.source || "LOCAL",
    });
  }

  for (const item of reading.filter((entry) => ["finished", "read"].includes(entry.manual?.status))) {
    if (!item.manual?.finishedDate && !item.manual?.date) continue;
    activities.push({
      type: "media",
      label: "BOOK FINISHED",
      title: mediaTitle(item),
      detail: item.author || "Manual reading entry",
      date: item.manual?.finishedDate || item.manual?.date,
      href: "/personal/media",
      source: item.source || "LOCAL",
    });
  }

  return sortByDate(activities).slice(0, 4);
}

export function useMediaData({ manualMedia = {}, legacyCurrentlyInto = {} } = {}) {
  const [state, setState] = useState({
    lastfmProfile: null,
    lastfmRecentTracks: null,
    lastfmTopArtists: null,
    lastfmTopAlbums: null,
    lastfmSummary: null,
    movies: null,
    tv: null,
    books: null,
    loading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [
        lastfmProfile,
        lastfmRecentTracks,
        lastfmTopArtists,
        lastfmTopAlbums,
        lastfmSummary,
        movies,
        tv,
        books,
      ] = await Promise.all([
        loadJson("/data/generated/lastfm/profile.json"),
        loadJson("/data/generated/lastfm/recent-tracks.json"),
        loadJson("/data/generated/lastfm/top-artists.json"),
        loadJson("/data/generated/lastfm/top-albums.json"),
        loadJson("/data/generated/lastfm/summary.json"),
        loadJson("/data/generated/media/movies.json"),
        loadJson("/data/generated/media/tv.json"),
        loadJson("/data/generated/media/books.json"),
      ]);

      if (cancelled) return;
      setState({
        lastfmProfile,
        lastfmRecentTracks,
        lastfmTopArtists,
        lastfmTopAlbums,
        lastfmSummary,
        movies,
        tv,
        books,
        loading: false,
        error: false,
      });
    }

    load().catch(() => {
      if (!cancelled) setState((current) => ({ ...current, loading: false, error: true }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const music = normalizeMusic({
      profile: state.lastfmProfile,
      recentTracks: state.lastfmRecentTracks,
      topArtists: state.lastfmTopArtists,
      topAlbums: state.lastfmTopAlbums,
      summary: state.lastfmSummary,
    });
    const watching = normalizeWatching(state.movies, state.tv, legacyCurrentlyInto.watching || manualMedia.watchingLegacy || []);
    const reading = normalizeReading(state.books, legacyCurrentlyInto.reading || manualMedia.readingLegacy || []);
    const currentWatching = currentWatchingItem(watching);
    const currentReading = currentReadingItem(reading);
    const currentListening = listeningItem(music);

    return {
      ...state,
      music,
      watching,
      reading,
      currentlyInto: {
        watching: currentWatching ? [{
          category: "Watching",
          title: currentWatching.title,
          detail: currentWatching.manual?.progress || currentWatching.manual?.status || currentWatching.metadata?.kind || "Watching",
          cover: currentWatching.cover,
          href: "/personal/media",
        }] : [],
        reading: currentReading ? [{
          category: "Reading",
          title: currentReading.title,
          detail: [currentReading.author, currentReading.manual?.progress != null ? `${currentReading.manual.progress}%` : currentReading.manual?.status].filter(Boolean).join(" / "),
          cover: currentReading.cover,
          href: "/personal/media",
        }] : [],
        listening: currentListening ? [currentListening] : [],
      },
      activity: mediaActivities({ music, watching, reading }),
    };
  }, [state, manualMedia, legacyCurrentlyInto]);
}
