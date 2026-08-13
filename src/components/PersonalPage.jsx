import AchievementsPreview from "./personal/AchievementsPreview.jsx";
import DevlogSection from "./personal/DevlogSection.jsx";
import GamingSection from "./personal/GamingSection.jsx";
import MediaSection from "./personal/MediaSection.jsx";
import PersonalHero from "./personal/PersonalHero.jsx";
import PersonalNav from "./personal/PersonalNav.jsx";
import PlayerNotes from "./personal/PlayerNotes.jsx";
import PersonalRoadmap from "./personal/PersonalRoadmap.jsx";
import {
  achievementPreview,
  currentlyPlaying,
  devlogEntries,
  gamingLibrary,
  mediaLog,
  personalProfile,
  personalRoadmap,
  playerNotes,
} from "../data/personal.js";

export default function PersonalPage() {
  return (
    <main className="personal-page">
      <PersonalHero profile={personalProfile} />
      <PersonalNav />
      <GamingSection currentlyPlaying={currentlyPlaying} gaming={gamingLibrary} />
      <PlayerNotes notes={playerNotes} />
      <MediaSection media={mediaLog} />
      <DevlogSection entries={devlogEntries} />
      <PersonalRoadmap roadmap={personalRoadmap} />
      <AchievementsPreview achievements={achievementPreview} />
    </main>
  );
}
