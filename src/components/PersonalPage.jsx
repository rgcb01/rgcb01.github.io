import AchievementsPreview from "./personal/AchievementsPreview.jsx";
import CurrentQuests from "./personal/CurrentQuests.jsx";
import DevlogSection from "./personal/DevlogSection.jsx";
import GamingSection from "./personal/GamingSection.jsx";
import MediaSection from "./personal/MediaSection.jsx";
import PersonalHero from "./personal/PersonalHero.jsx";
import PersonalRoadmap from "./personal/PersonalRoadmap.jsx";
import {
  achievementPreview,
  currentQuests,
  devlogEntries,
  gamingProfile,
  mediaLog,
  personalProfile,
  personalRoadmap,
} from "../data/personal.js";

export default function PersonalPage() {
  return (
    <main className="personal-page">
      <PersonalHero profile={personalProfile} />
      <CurrentQuests quests={currentQuests} />
      <GamingSection gaming={gamingProfile} />
      <MediaSection media={mediaLog} />
      <DevlogSection entries={devlogEntries} />
      <PersonalRoadmap roadmap={personalRoadmap} />
      <AchievementsPreview achievements={achievementPreview} />
    </main>
  );
}
