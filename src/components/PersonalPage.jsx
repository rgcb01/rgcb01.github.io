import AchievementsPreview from "./personal/AchievementsPreview.jsx";
import DevlogSection from "./personal/DevlogSection.jsx";
import GamingSection from "./personal/GamingSection.jsx";
import MediaSection from "./personal/MediaSection.jsx";
import PersonalHero from "./personal/PersonalHero.jsx";
import PersonalNav from "./personal/PersonalNav.jsx";
import PlayerNotes from "./personal/PlayerNotes.jsx";
import PersonalRoadmap from "./personal/PersonalRoadmap.jsx";
import RecentActivity from "./personal/RecentActivity.jsx";
import TrophyRoomPreview from "./personal/TrophyRoomPreview.jsx";
import { useTrophyData } from "./personal/useTrophyData.js";
import {
  currentlyInto,
  devlogEntries,
  manualActivity,
  milestoneDefinitions,
  personalProfile,
  personalRoadmap,
  playerThoughts,
} from "../data/personal.js";

export default function PersonalPage() {
  const trophyData = useTrophyData({
    manualActivity,
    milestoneDefinitions,
    currentGameOverride: personalProfile.currentGameOverride,
  });

  return (
    <main className="personal-page">
      <PersonalHero profile={personalProfile} trophyData={trophyData} />
      <PersonalNav />
      <TrophyRoomPreview trophyData={trophyData} />
      <GamingSection trophyData={trophyData} />
      <RecentActivity events={trophyData.activity} loading={trophyData.loading} error={trophyData.error} />
      <MediaSection media={currentlyInto} recentlyPlayed={trophyData.recentlyPlayed} />
      <PlayerNotes notes={playerThoughts} />
      <DevlogSection entries={devlogEntries} />
      <PersonalRoadmap roadmap={personalRoadmap} />
      <AchievementsPreview achievements={trophyData.milestones} loading={trophyData.loading} />
    </main>
  );
}
