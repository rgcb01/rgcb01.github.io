import { useEffect, useMemo, useState } from "react";
import { normalizePlayStationGame, normalizeSteamGame, platformAccountsFromData } from "../../data/gaming.js";
import { loadJson, byDateNewest } from "./trophies/trophyUtils.js";

function trophyTotal(profile) {
  const counts = profile?.profile?.earnedTrophies || {};
  return ["bronze", "silver", "gold", "platinum"].reduce((sum, type) => sum + Number(counts[type] || 0), 0);
}

function dateValue(value) {
  return value ? new Date(value).getTime() : 0;
}

function hasPsnData(profile, games) {
  return Boolean(profile?.synchronized && games?.length);
}

function deriveLatestPlatinum(profile, games) {
  if (!games.length) return null;
  const bySlug = games.find((game) => game.slug === profile?.stats?.latestPlatinumSlug);
  if (bySlug?.trophyProgress?.platinumEarned) return bySlug;

  return games
    .filter((game) => game.trophyProgress?.platinumEarned && game.trophyProgress?.platinumEarnedDate)
    .sort((a, b) => byDateNewest(a, b, (game) => game.trophyProgress?.platinumEarnedDate))[0] || null;
}

function deriveCurrentHunt(games, manualOverride) {
  if (!games.length) return null;
  if (!manualOverride) return null;
  return games.find((game) => game.slug === manualOverride || game.sources?.psnTitleId === manualOverride) || null;
}

function deriveRecentlyPlayed(games, manualOverride) {
  const manual = manualOverride ? games.find((game) => game.slug === manualOverride || game.sources?.psnTitleId === manualOverride) : null;
  const recent = games
    .filter((game) => game.recentActivityDate || game.trophyProgress?.lastTrophyDate || game.trophyProgress?.firstTrophyDate)
    .sort((a, b) => byDateNewest(a, b, (game) => game.recentActivityDate || game.trophyProgress?.lastTrophyDate || game.trophyProgress?.firstTrophyDate));
  const merged = manual ? [manual, ...recent.filter((game) => game.slug !== manual.slug)] : recent;
  return merged.slice(0, 4);
}

function deriveClosestToPlatinum(games) {
  return games
    .filter((game) => {
      const progress = game.trophyProgress;
      return progress?.platinumTrophyName && !progress.platinumEarned && Number(progress.progressPercent || 0) >= 20;
    })
    .sort((a, b) => (b.trophyProgress?.progressPercent || 0) - (a.trophyProgress?.progressPercent || 0))
    .slice(0, 5);
}

function derivePsnActivity({ games, manualActivity, latestPlatinum }) {
  const automatic = [];
  if (latestPlatinum) {
    automatic.push({
      type: "platinum",
      label: "PLATINUM EARNED",
      title: latestPlatinum.game?.title || "Latest platinum",
      detail: latestPlatinum.trophyProgress?.platinumTrophyName || "Platinum trophy earned.",
      date: latestPlatinum.trophyProgress?.platinumEarnedDate,
      href: `/personal/trophies/${latestPlatinum.slug}`,
      source: "PSN",
    });
  }

  games
    .filter((game) => game.recentActivityDate || game.trophyProgress?.lastTrophyDate)
    .sort((a, b) => byDateNewest(a, b, (game) => game.recentActivityDate || game.trophyProgress?.lastTrophyDate))
    .slice(0, 5)
    .forEach((game) => {
      automatic.push({
        type: "game",
        label: "RECENT TROPHY ACTIVITY",
        title: game.game?.title || "Trophy title",
        detail: `${game.trophyProgress?.progressPercent ?? 0}% complete`,
        date: game.recentActivityDate || game.trophyProgress?.lastTrophyDate,
        href: `/personal/trophies/${game.slug}`,
        source: "PSN",
      });
    });

  const local = manualActivity.map((event) => ({ ...event, source: event.source || "LOCAL" }));
  return [...automatic, ...local];
}

function deriveSteamActivity(steamGames) {
  const recent = steamGames
    .filter((game) => game.recentlyPlayed || game.lastPlayed)
    .sort((a, b) => dateValue(b.lastPlayed) - dateValue(a.lastPlayed))
    .slice(0, 4)
    .map((game) => ({
      type: "game",
      label: "RECENT STEAM PLAY",
      title: game.name,
      detail: `${game.recentPlaytimeHours ? `${game.recentPlaytimeHours} h recent / ` : ""}${game.playtimeHours} h total`,
      date: game.lastPlayed,
      href: "/personal/gaming",
      source: "STEAM",
    }));
  const perfect = steamGames
    .filter((game) => game.achievements?.perfect)
    .slice(0, 2)
    .map((game) => ({
      type: "perfect",
      label: "PERFECT GAME",
      title: game.name,
      detail: `${game.achievements.earned}/${game.achievements.total} achievements`,
      date: game.achievements.latestUnlock || game.lastPlayed,
      href: "/personal/gaming",
      source: "STEAM",
    }));
  return [...recent, ...perfect];
}

function deriveMilestones(profile, games, definitions) {
  const platinums = Number(profile?.profile?.earnedTrophies?.platinum || 0);
  const trophies = trophyTotal(profile);
  const gameCount = Number(profile?.stats?.gameCount || games.length || 0);

  return definitions.map((milestone) => {
    const current =
      milestone.type === "platinum" ? platinums :
      milestone.type === "trophy-count" ? trophies :
      milestone.type === "game-count" ? gameCount :
      milestone.current ?? 0;
    return {
      ...milestone,
      current,
      unlocked: current >= milestone.value,
    };
  });
}

function artworkFor(latestPlatinum, currentHunt, recentlyPlayed, steamGames) {
  const game = latestPlatinum || currentHunt || recentlyPlayed[0];
  return game?.game?.artwork || game?.game?.screenshots?.[0] || game?.game?.cover || game?.game?.psnIcon || steamGames[0]?.cover || steamGames[0]?.logoUrl || "";
}

function findCrossPlatform(psnGames, steamGames) {
  const psnByIgdb = new Map(psnGames.filter((game) => game.identities?.igdb?.id).map((game) => [Number(game.identities.igdb.id), game]));
  return steamGames
    .filter((game) => game.identities?.igdb?.id && psnByIgdb.has(Number(game.identities.igdb.id)))
    .map((steamGame) => ({
      internalGameId: steamGame.internalGameId,
      title: steamGame.name,
      steam: steamGame,
      playstation: psnByIgdb.get(Number(steamGame.identities.igdb.id)),
    }));
}

export function useGamingData({ manualActivity = [], milestoneDefinitions = [], currentGameOverride = null } = {}) {
  const [state, setState] = useState({
    psnProfile: null,
    psnGames: [],
    steamProfile: null,
    steamGames: [],
    steamRecent: [],
    steamSummary: null,
    loading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [psnProfile, psnGameData, steamProfile, steamGameData, steamRecent, steamSummary] = await Promise.all([
        loadJson("/data/generated/psn-profile.json"),
        loadJson("/data/generated/trophy-games.json"),
        loadJson("/data/generated/steam/profile.json"),
        loadJson("/data/generated/steam/games.json"),
        loadJson("/data/generated/steam/recently-played.json"),
        loadJson("/data/generated/steam/summary.json"),
      ]);

      if (cancelled) return;
      setState({
        psnProfile,
        psnGames: psnGameData?.games || [],
        steamProfile,
        steamGames: steamGameData?.games || [],
        steamRecent: steamRecent?.games || [],
        steamSummary,
        loading: false,
        error: !psnProfile || !psnGameData,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const latestPlatinum = deriveLatestPlatinum(state.psnProfile, state.psnGames);
    const currentHunt = deriveCurrentHunt(state.psnGames, currentGameOverride);
    const recentlyPlayed = deriveRecentlyPlayed(state.psnGames, currentGameOverride);
    const closestToPlatinum = deriveClosestToPlatinum(state.psnGames);
    const activity = [...derivePsnActivity({ games: state.psnGames, manualActivity, latestPlatinum }), ...deriveSteamActivity(state.steamGames)]
      .filter((event) => event.date || event.title)
      .sort((a, b) => dateValue(b.date) - dateValue(a.date))
      .slice(0, 10);
    const milestones = deriveMilestones(state.psnProfile, state.psnGames, milestoneDefinitions);
    const normalizedPsnGames = state.psnGames.map((game) => normalizePlayStationGame(game));
    const normalizedSteamGames = state.steamGames.map((game) => normalizeSteamGame(game));
    const topSteamGames = state.steamGames.slice().sort((a, b) => Number(b.playtimeMinutes || 0) - Number(a.playtimeMinutes || 0)).slice(0, 10);
    const recentSteamGames = state.steamGames
      .filter((game) => game.recentlyPlayed || game.lastPlayed)
      .sort((a, b) => dateValue(b.lastPlayed) - dateValue(a.lastPlayed))
      .slice(0, 6);

    return {
      ...state,
      hasRealData: hasPsnData(state.psnProfile, state.psnGames),
      steamConnected: Boolean(state.steamSummary?.available && state.steamSummary?.synchronized),
      psnOnlineId: state.psnProfile?.psnOnlineId || "rgcb01",
      gameCount: Number(state.psnProfile?.stats?.gameCount || state.psnGames.length || 0),
      totalTrophies: trophyTotal(state.psnProfile),
      platinumCount: Number(state.psnProfile?.profile?.earnedTrophies?.platinum || 0),
      syncedAt: state.psnProfile?.syncedAt || null,
      latestPlatinum,
      currentHunt,
      recentlyPlayed,
      closestToPlatinum,
      normalizedGames: normalizedPsnGames,
      normalizedPsnGames,
      normalizedSteamGames,
      crossPlatformGames: findCrossPlatform(normalizedPsnGames, state.steamGames),
      topSteamGames,
      recentSteamGames,
      activity,
      milestones,
      trophyLevel: state.psnProfile?.profile?.trophyLevel || null,
      artwork: artworkFor(latestPlatinum, currentHunt, recentlyPlayed, state.steamGames),
      platformAccounts: platformAccountsFromData({
        psnOnlineId: state.psnProfile?.psnOnlineId || "rgcb01",
        steamProfile: state.steamProfile,
        steamSummary: state.steamSummary,
      }),
    };
  }, [state, manualActivity, milestoneDefinitions, currentGameOverride]);
}
