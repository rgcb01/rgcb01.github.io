import { formatDate } from "./trophies/trophyUtils.js";

function EmptyThoughts() {
  return (
    <article className="console-card player-note-empty">
      <span>Local</span>
      <strong>No public thoughts logged yet.</strong>
      <p>Short notes about games, design, engineering ideas or media will appear here when they exist.</p>
    </article>
  );
}

export default function PlayerNotes({ notes }) {
  return (
    <section className="personal-section" id="thoughts">
      <div className="personal-heading">
        <p className="console-kicker">Player Thoughts</p>
        <h2>Short public notes for games, design observations and project ideas.</h2>
      </div>
      {notes.length ? (
        <div className="player-notes-grid">
          {notes.map((note) => (
            <article className="console-card note-card" key={`${note.date}-${note.title}`}>
              <span>{note.date ? formatDate(note.date) : "Local note"}</span>
              <strong>{note.title}</strong>
              <p>{note.summary}</p>
              {note.tags?.length ? (
                <div className="console-chip-list">
                  {note.tags.map((tag) => <b key={tag}>{tag}</b>)}
                </div>
              ) : null}
              {note.href ? <a href={note.href}>Open note</a> : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyThoughts />
      )}
    </section>
  );
}
