export const personalProfile = {
  name: "Romulo Colorado",
  handle: "rgcb01",
  introLines: ["Engineer by profession.", "Builder by curiosity.", "Player by nature."],
  status: "ONLINE",
  statusChips: ["ONLINE", "PSN LINKED", "PROFILE SYNCED"],
  location: "Puebla, Mexico",
  currentGameOverride: null,
};

export const manualActivity = [
  {
    type: "build",
    label: "BUILD LOG",
    title: "Separating professional mode from personal mode",
    detail: "The public site now has a recruiter portfolio and a personal console layer with different jobs.",
    date: "2026-08-13",
    href: "/personal#build-log",
    source: "LOCAL",
  },
  {
    type: "build",
    label: "BUILD LOG",
    title: "Industrial Automation Cell Simulator notes",
    detail: "State-machine debugging notes from the OpenPLC / Modbus simulator work.",
    date: "2026-08-13",
    href: "https://github.com/rgcb01/industrial-automation-cell-simulator",
    source: "LOCAL",
  },
];

export const currentlyInto = {
  playing: [],
  watching: [],
  reading: [],
  listening: [],
};

export const playerThoughts = [];

export const devlogEntries = [
  {
    date: "2026-08-13",
    project: "Industrial Automation Cell Simulator",
    category: "AUTOMATION",
    title: "The interesting part was the state bug",
    summary:
      "Spent a long stretch chasing PLC state behavior. The lesson was less about one bug and more about how quickly duplicated state becomes impossible to reason about.",
    tags: ["PLC", "OpenPLC", "State Machines"],
    optionalLink: "https://github.com/rgcb01/industrial-automation-cell-simulator",
  },
  {
    date: "2026-08-13",
    project: "Portfolio",
    category: "SITE",
    title: "Separating professional mode from personal mode",
    summary:
      "The professional site needs to stay clean for recruiters, but the personal page can become a small console for games, media and experiments.",
    tags: ["React", "Portfolio", "Personal Site"],
    optionalLink: "",
  },
];

export const personalRoadmap = [
  {
    stage: "Live",
    status: "Running",
    items: ["PlayStation Sync", "Trophy Room", "IGDB Enrichment", "Console Home", "Game Detail Pages"],
  },
  {
    stage: "Building",
    status: "In Progress",
    items: ["IGDB Cleanup", "Manual Reviews", "Multi-Platform Identity Model", "Recent Activity"],
  },
  {
    stage: "Next",
    status: "Queued",
    items: ["Steam Integration", "Media APIs", "Canonical Gaming Hub"],
  },
  {
    stage: "Later",
    status: "Concept",
    items: ["Xbox Integration", "Epic Support", "Life Console", "XP / Daily Check-In", "Questlines"],
  },
];

export const milestoneDefinitions = [
  {
    title: "25 Platinums",
    type: "platinum",
    value: 25,
    rarity: "Platinum",
    description: "Unlocked when the PSN profile reaches 25 earned platinum trophies.",
  },
  {
    title: "80 Games Tracked",
    type: "game-count",
    value: 80,
    rarity: "Rare",
    description: "Unlocked when the generated Trophy Room tracks at least 80 trophy titles.",
  },
  {
    title: "2,500 Trophies",
    type: "trophy-count",
    value: 2500,
    rarity: "Epic",
    description: "Future trophy-count milestone derived from the synced PSN profile.",
  },
  {
    title: "Trophy Room Online",
    type: "manual",
    value: 1,
    current: 1,
    rarity: "System",
    description: "Unlocked when the public PSN-powered Trophy Room became available.",
  },
  {
    title: "Personal Console Online",
    type: "manual",
    value: 1,
    current: 1,
    rarity: "System",
    description: "Unlocked when /personal became the public console home layer.",
  },
  {
    title: "First Published Engineering Paper",
    type: "manual",
    value: 1,
    current: 1,
    rarity: "Legendary",
    description: "Unlocked by publishing the classical computer vision inspection paper with DOI.",
  },
];
