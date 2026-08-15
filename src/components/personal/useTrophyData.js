import { useGamingData } from "./useGamingData.js";

export function useTrophyData({ manualActivity = [], milestoneDefinitions = [], currentGameOverride = null } = {}) {
  const data = useGamingData({ manualActivity, milestoneDefinitions, currentGameOverride });
  return {
    ...data,
    profile: data.psnProfile,
    games: data.psnGames,
  };
}
