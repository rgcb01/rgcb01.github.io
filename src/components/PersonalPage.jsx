import {
  ConsoleApps,
  ContinueWidget,
  CurrentlyIntoPreview,
  LatestAchievementWidget,
  RecentActivityPreview,
  TrophyGamingOverviewWidget,
} from "./personal/ConsoleHomeWidgets.jsx";
import PersonalHero from "./personal/PersonalHero.jsx";
import PersonalNav from "./personal/PersonalNav.jsx";
import PlatformStatus from "./personal/PlatformStatus.jsx";
import { useGamingData } from "./personal/useGamingData.js";
import { useMediaData } from "./personal/useMediaData.js";
import {
  currentlyInto,
  devlogEntries,
  manualActivity,
  mediaLibrary,
  milestoneDefinitions,
  personalProfile,
  playerThoughts,
} from "../data/personal.js";

export default function PersonalPage() {
  const trophyData = useGamingData({
    manualActivity,
    milestoneDefinitions,
    currentGameOverride: personalProfile.currentGameOverride,
  });
  const mediaData = useMediaData({ manualMedia: mediaLibrary, legacyCurrentlyInto: currentlyInto });
  const homeMedia = {
    playing: currentlyInto.playing,
    watching: mediaData.currentlyInto.watching,
    reading: mediaData.currentlyInto.reading,
    listening: mediaData.currentlyInto.listening,
  };
  const homeActivity = [...mediaData.activity, ...trophyData.activity]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return (
    <main className="personal-page">
      <PersonalHero profile={personalProfile} trophyData={trophyData} />
      <PersonalNav />
      <PlatformStatus accounts={trophyData.platformAccounts} />
      <TrophyGamingOverviewWidget trophyData={trophyData} />
      <section className="personal-section console-home-layout" aria-label="Console dashboard">
        <ContinueWidget trophyData={trophyData} media={homeMedia} devlogEntries={devlogEntries} />
        <LatestAchievementWidget trophyData={trophyData} />
      </section>
      <CurrentlyIntoPreview media={homeMedia} recentlyPlayed={trophyData.recentlyPlayed} />
      <section className="personal-section console-home-layout lower" aria-label="Console launchers and activity">
        <RecentActivityPreview events={homeActivity} />
        <ConsoleApps trophyData={trophyData} devlogEntries={devlogEntries} thoughts={playerThoughts} />
      </section>
    </main>
  );
}
