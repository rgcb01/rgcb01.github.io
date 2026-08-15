import ConsoleRouteShell from "./ConsoleRouteShell.jsx";
import DevlogSection from "./DevlogSection.jsx";
import { devlogEntries } from "../../data/personal.js";

export default function BuildLogPage() {
  return (
    <ConsoleRouteShell
      kicker="Build Log"
      title="Development journal."
      subtitle="Personal notes from projects, experiments and debugging sessions."
    >
      <DevlogSection entries={devlogEntries} />
    </ConsoleRouteShell>
  );
}
