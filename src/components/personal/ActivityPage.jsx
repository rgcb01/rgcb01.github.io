import { useMemo, useState } from "react";
import ConsoleRouteShell from "./ConsoleRouteShell.jsx";
import { useGamingData } from "./useGamingData.js";
import { useMediaData } from "./useMediaData.js";
import { currentlyInto, devlogEntries, manualActivity, mediaLibrary, milestoneDefinitions, personalProfile } from "../../data/personal.js";
import { formatDate } from "./trophies/trophyUtils.js";

function buildEvents(entries) {
  return entries.map((entry) => ({
    type: "build",
    label: "BUILD LOG",
    title: entry.title,
    detail: entry.project,
    date: entry.date,
    href: "/personal/builds",
    source: "BUILD",
  }));
}

function groupFor(event) {
  if (["PSN", "STEAM"].includes(event.source)) return "GAMING";
  if (event.type === "build" || event.source === "BUILD" || event.source === "LOCAL") return "BUILD";
  if (event.type === "media") return "MEDIA";
  if (event.type === "thought") return "THOUGHTS";
  return "SYSTEM";
}

function ActivityRow({ event }) {
  return (
    <a className={`activity-row ${event.type}`} href={event.href || "/personal/activity"} target={event.href?.startsWith("http") ? "_blank" : undefined} rel={event.href?.startsWith("http") ? "noopener noreferrer" : undefined}>
      <div>
        <span>{event.label}</span>
        <strong>{event.title}</strong>
        {event.detail ? <p>{event.detail}</p> : null}
      </div>
      <div className="activity-meta">
        <b>{event.source}</b>
        {event.date ? <em>{formatDate(event.date)}</em> : null}
      </div>
    </a>
  );
}

export default function ActivityPage() {
  const gamingData = useGamingData({
    manualActivity,
    milestoneDefinitions,
    currentGameOverride: personalProfile.currentGameOverride,
  });
  const mediaData = useMediaData({ manualMedia: mediaLibrary, legacyCurrentlyInto: currentlyInto });
  const [filter, setFilter] = useState("ALL");
  const filters = ["ALL", "GAMING", "BUILD", "MEDIA", "THOUGHTS", "SYSTEM"];
  const events = useMemo(() => {
    const merged = [...gamingData.activity, ...mediaData.activity, ...buildEvents(devlogEntries)]
      .filter((event, index, list) => list.findIndex((item) => `${item.title}-${item.date}` === `${event.title}-${event.date}`) === index)
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return filter === "ALL" ? merged : merged.filter((event) => groupFor(event) === filter);
  }, [gamingData.activity, mediaData.activity, filter]);

  return (
    <ConsoleRouteShell
      kicker="Activity"
      title="Timeline."
      subtitle="A fuller activity stream across gaming, builds and local console events."
    >
      <section className="personal-section">
        <div className="gaming-filter-row" aria-label="Activity filters">
          {filters.map((item) => (
            <button className={filter === item ? "active" : ""} type="button" onClick={() => setFilter(item)} key={item}>
              {item}
            </button>
          ))}
        </div>
        <div className="activity-feed route-activity-feed">
          {events.length ? events.map((event) => <ActivityRow event={event} key={`${event.source}-${event.title}-${event.date}`} />) : (
            <article className="console-card player-note-empty">
              <span>{filter}</span>
              <strong>Nothing logged here yet.</strong>
              <p>Try another filter or wait for the next sync.</p>
            </article>
          )}
        </div>
      </section>
    </ConsoleRouteShell>
  );
}
