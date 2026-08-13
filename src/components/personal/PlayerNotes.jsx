function EmptyNotes() {
  return (
    <article className="console-card player-note-empty">
      <span>Notebook Empty</span>
      <strong>No player notes logged yet.</strong>
      <p>Future notes can capture real impressions from games, movies, books or experiments.</p>
    </article>
  );
}

export default function PlayerNotes({ notes }) {
  return (
    <section className="personal-section" id="player-notes">
      <div className="personal-heading">
        <p className="console-kicker">Player Notes</p>
        <h2>Short manual notes for things worth remembering.</h2>
      </div>
      {notes.length ? (
        <div className="player-notes-grid">
          {notes.map((note) => (
            <article className="console-card note-card" key={note.title}>
              <span>{note.rating || "Manual note"}</span>
              <strong>{note.title}</strong>
              {note.liked && <p><b>Liked:</b> {note.liked}</p>}
              {note.wouldChange && <p><b>Would change:</b> {note.wouldChange}</p>}
              {note.takeaway && <p><b>Takeaway:</b> {note.takeaway}</p>}
            </article>
          ))}
        </div>
      ) : (
        <EmptyNotes />
      )}
    </section>
  );
}
