import { useEffect, useMemo, useState } from "react";
import { normalizePlayStationGame } from "../../data/gaming.js";
import { loadJson, byDateNewest } from "./trophies/trophyUtils.js";

function trophyTotal(profile) {
  const counts = profile?.profile?.earnedTrophies || {};
  return ["bronze", "silver", "gold", "platinum"].reduce((sum, type) => sum + Number(counts[type] || 0), 0);
}

function dateValue(value) {
  return value ? new Date(value).getTime() : 0;
}

function artworkFor(game) {
  return game?.game?.artwork || game?.game?.screenshots?.[0] || game?.game?.cover || game?.game?.psnIcon || "";
}

function hasRealData(profile, games) {
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

function deriveCurrentHunt(profile, games, manualOverride) {
  if (!games.length) return null;
  const override = manualOverride ? games.find((game) => game.slug === manualOverride || game.sources?.psnTitleId === manualOverride) : null;
  if (override) return override;
  return games.find((game) => game.slug === profile?.stats?.currentPlatinumHuntSlug) || null;
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

function deriveActivity({ profile, games, manualActivity, latestPlatinum }) {
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
  return [...automatic, ...local]
    .filter((event) => event.date || event.title)
    .sort((a, b) => dateValue(b.date) - dateValue(a.date))
    .slice(0, 8);
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

export function useTrophyData({ manualActivity = [], milestoneDefinitions = [], currentGameOverride = null } = {}) {
  const [state, setState] = useState({
    profile: null,
    games: [],
    loading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [profileData, gameData] = await Promise.all([
        loadJson("/data/generated/psn-profile.json"),
        loadJson("/data/generated/trophy-games.json"),
      ]);

      if (cancelled) return;
      setState({
        profile: profileData,
        games: gameData?.games || [],
        loading: false,
        error: !profileData || !gameData,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const latestPlatinum = deriveLatestPlatinum(state.profile, state.games);
    const currentHunt = deriveCurrentHunt(state.profile, state.games, currentGameOverride);
    const recentlyPlayed = deriveRecentlyPlayed(state.games, currentGameOverride);
    const closestToPlatinum = deriveClosestToPlatinum(state.games);
    const activity = deriveActivity({ profile: state.profile, games: state.games, manualActivity, latestPlatinum });
    const milestones = deriveMilestones(state.profile, state.games, milestoneDefinitions);
    const normalizedGames = state.games.map((game) => normalizePlayStationGame(game));

    return {
      ...state,
      hasRealData: hasRealData(state.profile, state.games),
      psnOnlineId: state.profile?.psnOnlineId || "rgcb01",
      gameCount: Number(state.profile?.stats?.gameCount || state.games.length || 0),
      totalTrophies: trophyTotal(state.profile),
      platinumCount: Number(state.profile?.profile?.earnedTrophies?.platinum || 0),
      syncedAt: state.profile?.syncedAt || null,
      latestPlatinum,
      currentHunt,
      recentlyPlayed,
      closestToPlatinum,
      normalizedGames,
      activity,
      milestones,
      trophyLevel: state.profile?.profile?.trophyLevel || null,
      artwork: artworkFor(latestPlatinum || currentHunt || recentlyPlayed[0]),
    };
  }, [state, manualActivity, milestoneDefinitions, currentGameOverride]);
}
