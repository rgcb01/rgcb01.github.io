export const personalProfile = {
  name: "Romulo Colorado",
  introLines: ["Engineer by profession.", "Builder by curiosity.", "Player by nature."],
  status: "ONLINE / EXPLORING",
  currently: ["Building things", "Playing games", "Chasing platinum trophies", "Learning whatever catches my attention"],
  fields: [
    { label: "Current Focus", value: "Personal profile V0.2" },
    { label: "Mode", value: "Manual log" },
    { label: "Location", value: "Puebla, Mexico" },
  ],
};

export const currentlyPlaying = [];

export const gamingLibrary = {
  platforms: ["PlayStation", "Steam"],
  categories: [
    {
      title: "Recently Played",
      items: [],
      empty: "No sessions logged yet.",
    },
    {
      title: "Completed",
      items: [],
      empty: "Completed games will be added manually.",
    },
    {
      title: "Platinum Targets",
      items: [],
      empty: "No platinum target selected yet.",
    },
    {
      title: "Backlog / Next Games",
      items: [],
      empty: "Backlog entries coming soon.",
    },
  ],
};

export const playerNotes = [];

export const mediaLog = {
  watchingNow: [],
  recentlyWatched: [],
  favorites: [],
};

export const devlogEntries = [
  {
    date: "2026-08-13",
    project: "Industrial Automation Cell Simulator",
    title: "The interesting part was the state bug",
    summary:
      "Spent a long stretch chasing PLC state behavior. The lesson was less about one bug and more about how quickly duplicated state becomes impossible to reason about.",
    tags: ["PLC", "OpenPLC", "State Machines"],
    optionalLink: "https://github.com/rgcb01/industrial-automation-cell-simulator",
  },
  {
    date: "2026-08-13",
    project: "Portfolio",
    title: "Separating professional mode from personal mode",
    summary:
      "The professional site needs to stay clean for recruiters, but the personal page can become a small console for games, media and experiments.",
    tags: ["React", "Portfolio", "Personal Site"],
    optionalLink: "",
  },
];

export const personalRoadmap = [
  {
    stage: "Now",
    status: "Active",
    items: ["Polish personal profile", "Update CV", "Keep personal data manual and honest"],
  },
  {
    stage: "Next",
    status: "Planned",
    items: ["Add real gaming entries", "Add media notes", "Expand devlog"],
  },
  {
    stage: "Later",
    status: "Future",
    items: ["PlayStation integration", "Steam integration", "Trophy / achievement tracking", "Life Console prototype"],
  },
];

export const achievementPreview = [
  {
    title: "Achievement Slot",
    state: "Locked",
    rarity: "System Preview",
    description: "Future milestone slot for verified games, projects and personal systems.",
  },
  {
    title: "Rare Slot",
    state: "Locked",
    rarity: "Rare",
    description: "Reserved for meaningful milestones, not filler stats.",
  },
  {
    title: "Platinum Slot",
    state: "Locked",
    rarity: "Platinum",
    description: "Eventually this will track verified long-form goals.",
  },
];
