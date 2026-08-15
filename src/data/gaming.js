export const gamingAccounts = {
  playstation: {
    enabled: true,
    label: "PlayStation",
    username: "rgcb01",
    status: "Connected",
    publicProfile: "/personal/trophies",
  },
  steam: {
    enabled: false,
    label: "Steam",
    status: "Not connected",
    requiredConfig: ["STEAM_API_KEY", "STEAM_ID"],
  },
  xbox: {
    enabled: false,
    label: "Xbox",
    status: "Future",
    requiredConfig: [],
  },
  epic: {
    enabled: false,
    label: "Epic",
    status: "Future",
    requiredConfig: [],
  },
};

export const platformRecordShapes = {
  playstation: {
    source: "playstation",
    identityField: "npCommunicationId",
    completionLanguage: "trophies",
    specialCompletion: "platinum",
  },
  steam: {
    source: "steam",
    identityField: "appId",
    completionLanguage: "achievements",
    recordShape: {
      source: "steam",
      appId: null,
      name: "",
      playtimeMinutes: null,
      recentlyPlayed: false,
      achievements: {
        earned: null,
        total: null,
        percent: null,
      },
    },
  },
  xbox: {
    source: "xbox",
    identityField: "titleId",
    completionLanguage: "achievements / gamerscore",
    recordShape: {
      source: "xbox",
      titleId: null,
      gamerscoreEarned: null,
      gamerscoreTotal: null,
      achievementsEarned: null,
      achievementsTotal: null,
    },
  },
  epic: {
    source: "epic",
    identityField: "catalogId",
    completionLanguage: "achievements",
    recordShape: {
      source: "epic",
      catalogId: null,
      achievements: {
        earned: null,
        total: null,
        percent: null,
      },
    },
  },
};

export const gameIdentityOverrides = {};

export function canonicalGameId({ igdbId, psnTitleId, steamAppId, xboxTitleId, epicCatalogId }) {
  if (igdbId) return `igdb:${igdbId}`;
  if (psnTitleId) return `psn:${psnTitleId}`;
  if (steamAppId) return `steam:${steamAppId}`;
  if (xboxTitleId) return `xbox:${xboxTitleId}`;
  if (epicCatalogId) return `epic:${epicCatalogId}`;
  return "game:unknown";
}

export function normalizePlayStationGame(game) {
  const psnTitleId = game?.sources?.psnTitleId || game?.identities?.psn?.titleId;
  const igdbId = game?.sources?.igdbId || game?.identities?.igdb?.id;

  return {
    internalGameId: game?.internalGameId || canonicalGameId({ igdbId, psnTitleId }),
    igdbId,
    title: game?.game?.title || "Untitled game",
    metadata: {
      source: "igdb",
      status: game?.sync?.enrichmentStatus || "unknown",
    },
    identities: {
      psn: psnTitleId ? { titleId: psnTitleId, serviceName: game?.sources?.psnServiceName } : undefined,
      igdb: igdbId ? { id: igdbId } : undefined,
    },
    platformProgress: [
      {
        source: "playstation",
        label: "PlayStation trophies",
        percent: game?.trophyProgress?.progressPercent ?? null,
        earned: game?.trophyProgress?.earned ?? null,
        total: game?.trophyProgress?.total ?? null,
        platinumEarned: Boolean(game?.trophyProgress?.platinumEarned),
      },
    ],
  };
}
