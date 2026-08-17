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
import {
  currentlyInto,
  devlogEntries,
  manualActivity,
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

  return (
    <main className="personal-page">
      <PersonalHero profile={personalProfile} trophyData={trophyData} />
      <PersonalNav />
      <PlatformStatus accounts={trophyData.platformAccounts} />
      <TrophyGamingOverviewWidget trophyData={trophyData} />
      <section className="personal-section console-home-layout" aria-label="Console dashboard">
        <ContinueWidget trophyData={trophyData} media={currentlyInto} devlogEntries={devlogEntries} />
        <LatestAchievementWidget trophyData={trophyData} />
      </section>
      <CurrentlyIntoPreview media={currentlyInto} recentlyPlayed={trophyData.recentlyPlayed} />
      <section className="personal-section console-home-layout lower" aria-label="Console launchers and activity">
        <RecentActivityPreview events={trophyData.activity} />
        <ConsoleApps trophyData={trophyData} devlogEntries={devlogEntries} thoughts={playerThoughts} />
      </section>
    </main>
  );
}
