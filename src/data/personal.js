export const personalProfile = {
  name: "Romulo Colorado",
  subtitle: "Engineer by day. Platinum hunter by night.",
  fields: [
    { label: "Current Level", value: "Coming soon" },
    { label: "Since", value: "2026" },
    { label: "Current Focus", value: "Building the life console" },
    { label: "Status", value: "Offline mode, planning next quest" },
    { label: "Location", value: "Puebla, Mexico" },
  ],
};

export const currentQuests = [
  {
    label: "Currently Playing",
    value: "Coming soon",
    detail: "Manual game log will live here.",
  },
  {
    label: "Currently Watching",
    value: "Coming soon",
    detail: "Movies and series will be tracked manually in V0.2.",
  },
  {
    label: "Currently Building",
    value: "Personal console V0.1",
    detail: "A separate personal space for gaming, media, devlogs and experiments.",
  },
  {
    label: "Current Platinum Target",
    value: "Not set",
    detail: "No trophy counts or targets are invented.",
  },
];

export const gamingProfile = {
  platforms: ["PlayStation", "Steam"],
  platinumCount: null,
  currentlyPlaying: [],
  recentGames: [],
  backlog: [],
};

export const mediaLog = {
  games: [],
  movies: [],
  series: [],
};

export const devlogEntries = [
  {
    date: "2026-08-13",
    title: "Personal page V0.1",
    category: "Website",
    summary:
      "Created the first structure for a separate personal player profile without mixing it into the recruiter-facing navigation.",
    status: "Live draft",
    link: "",
  },
];

export const personalRoadmap = [
  {
    stage: "Now",
    items: ["Player profile shell", "Manual quest cards", "Gaming and media empty states"],
  },
  {
    stage: "Next",
    items: ["Add real currently playing list", "Add first media notes", "Add trophy backlog manually"],
  },
  {
    stage: "Someday",
    items: ["Life console concepts", "XP experiments", "Achievements and long-term stats"],
  },
];

export const achievementPreview = [
  {
    title: "First Save File",
    state: "Unlocked",
    rarity: "Common",
    description: "Personal profile structure created.",
  },
  {
    title: "Platinum Archive",
    state: "Locked",
    rarity: "Rare",
    description: "Future space for verified gaming milestones.",
  },
  {
    title: "Life Console",
    state: "Locked",
    rarity: "Platinum",
    description: "Future system for quests, streaks and achievements.",
  },
];
