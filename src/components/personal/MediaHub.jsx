import ConsoleRouteShell from "./ConsoleRouteShell.jsx";
import MediaSection from "./MediaSection.jsx";
import { useGamingData } from "./useGamingData.js";
import { currentlyInto, manualActivity, milestoneDefinitions, personalProfile } from "../../data/personal.js";

export default function MediaHub() {
  const gamingData = useGamingData({
    manualActivity,
    milestoneDefinitions,
    currentGameOverride: personalProfile.currentGameOverride,
  });

  return (
    <ConsoleRouteShell
      kicker="Media Hub"
      title="Currently into."
      subtitle="Manual shelves for games, watching, reading and listening."
    >
      <MediaSection media={currentlyInto} recentlyPlayed={gamingData.recentlyPlayed} />
      <section className="personal-section">
        <article className="console-card route-note-card">
          <span>Next</span>
          <strong>Media APIs stay out of this milestone.</strong>
          <p>Last.fm, TMDB and reading integrations can plug into this route later without crowding the console home.</p>
        </article>
      </section>
    </ConsoleRouteShell>
  );
}
