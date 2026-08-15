import AchievementsPreview from "./AchievementsPreview.jsx";
import ConsoleRouteShell from "./ConsoleRouteShell.jsx";
import PersonalRoadmap from "./PersonalRoadmap.jsx";
import PlatformStatus from "./PlatformStatus.jsx";
import { useGamingData } from "./useGamingData.js";
import { manualActivity, milestoneDefinitions, personalProfile, personalRoadmap } from "../../data/personal.js";

function roadmapWithSteam(gamingData) {
  return personalRoadmap.map((stage) => {
    if (!gamingData.steamConnected) return stage;
    if (stage.stage === "Live") return { ...stage, items: [...new Set([...stage.items, "Steam Sync"])] };
    if (stage.stage === "Building") return { ...stage, items: stage.items.filter((item) => item !== "Steam Sync") };
    return stage;
  });
}

export default function SystemPage() {
  const gamingData = useGamingData({
    manualActivity,
    milestoneDefinitions,
    currentGameOverride: personalProfile.currentGameOverride,
  });
  const steamSummary = gamingData.steamSummary || {};

  return (
    <ConsoleRouteShell
      kicker="Console System"
      title="Connections and roadmap."
      subtitle="The meta layer for data sources, milestones and what comes next."
    >
      <PlatformStatus accounts={gamingData.platformAccounts} />
      <section className="personal-section">
        <div className="personal-heading">
          <p className="console-kicker">System Status</p>
          <h2>Public data sources currently feeding the console.</h2>
        </div>
        <div className="console-grid three">
          <article className="console-card route-note-card">
            <span>PSN</span>
            <strong>{gamingData.hasRealData ? "Synced" : "Unavailable"}</strong>
            <p>{gamingData.gameCount} trophy titles and {gamingData.platinumCount} platinums.</p>
          </article>
          <article className="console-card route-note-card">
            <span>Steam</span>
            <strong>{gamingData.steamConnected ? "Connected" : "Unavailable"}</strong>
            <p>{gamingData.steamConnected ? `${steamSummary.ownedGames} games, ${steamSummary.totalPlaytimeHours} h, ${steamSummary.perfectGames} perfect games.` : "Steam data is optional and safe to skip."}</p>
          </article>
          <article className="console-card route-note-card">
            <span>IGDB</span>
            <strong>Enrichment</strong>
            <p>Shared game metadata supports canonical identity without merging platform progress.</p>
          </article>
        </div>
      </section>
      <PersonalRoadmap roadmap={roadmapWithSteam(gamingData)} />
      <AchievementsPreview achievements={gamingData.milestones} loading={gamingData.loading} />
      <section className="personal-section">
        <article className="console-card route-note-card">
          <span>About This Console</span>
          <strong>Life is the game. RGCB is the console.</strong>
          <p>The home screen stays short; this route keeps the system details, roadmap and milestone layer out of the main dashboard.</p>
        </article>
      </section>
    </ConsoleRouteShell>
  );
}
