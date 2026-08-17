import ConsoleRouteShell from "./ConsoleRouteShell.jsx";
import MediaSection from "./MediaSection.jsx";
import { useGamingData } from "./useGamingData.js";
import { useMediaData } from "./useMediaData.js";
import { currentlyInto, manualActivity, mediaLibrary, milestoneDefinitions, personalProfile } from "../../data/personal.js";

export default function MediaHub() {
  const gamingData = useGamingData({
    manualActivity,
    milestoneDefinitions,
    currentGameOverride: personalProfile.currentGameOverride,
  });
  const mediaData = useMediaData({ manualMedia: mediaLibrary, legacyCurrentlyInto: currentlyInto });

  return (
    <ConsoleRouteShell
      kicker="Media Hub"
      title="Currently into."
      subtitle="Live listening, enriched media metadata and manual personal status kept separate."
    >
      <MediaSection media={currentlyInto} recentlyPlayed={gamingData.recentlyPlayed} mediaData={mediaData} />
    </ConsoleRouteShell>
  );
}
