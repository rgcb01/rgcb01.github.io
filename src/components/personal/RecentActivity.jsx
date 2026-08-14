import { formatDate } from "./trophies/trophyUtils.js";

function ActivityRow({ event }) {
  const content = (
    <>
      <div>
        <span>{event.label}</span>
        <strong>{event.title}</strong>
        {event.detail ? <p>{event.detail}</p> : null}
      </div>
      <div className="activity-meta">
        <b>{event.source}</b>
        {event.date ? <em>{formatDate(event.date)}</em> : null}
      </div>
    </>
  );

  if (event.href) {
    return (
      <a className={`activity-row ${event.type}`} href={event.href} target={event.href.startsWith("http") ? "_blank" : undefined} rel={event.href.startsWith("http") ? "noopener noreferrer" : undefined}>
        {content}
      </a>
    );
  }

  return <article className={`activity-row ${event.type}`}>{content}</article>;
}

export default function RecentActivity({ events, loading, error }) {
  return (
    <section className="personal-section" id="activity">
      <div className="personal-heading">
        <p className="console-kicker">Recent Activity</p>
        <h2>A short feed from trophy progress and authored build updates.</h2>
      </div>
      <div className="activity-feed">
        {events.length ? (
          events.map((event) => <ActivityRow event={event} key={`${event.label}-${event.title}-${event.date}`} />)
        ) : (
          <article className="console-card player-note-empty">
            <span>{loading ? "Syncing" : error ? "Unavailable" : "Empty"}</span>
            <strong>{loading ? "Loading recent activity." : "No recent public activity to show."}</strong>
            <p>{error ? "Trophy data could not load, but manual sections remain available." : "New public activity will appear when it exists."}</p>
          </article>
        )}
      </div>
    </section>
  );
}
