import ConsoleRouteShell from "./ConsoleRouteShell.jsx";
import PlayerNotes from "./PlayerNotes.jsx";
import { playerThoughts } from "../../data/personal.js";

export default function ThoughtsPage() {
  return (
    <ConsoleRouteShell
      kicker="Player Thoughts"
      title="Notes."
      subtitle="Short personal observations about games, design, engineering and media."
    >
      <PlayerNotes notes={playerThoughts} />
    </ConsoleRouteShell>
  );
}
