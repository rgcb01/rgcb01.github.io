export default function TrophyRoomPreview() {
  return (
    <section className="personal-section" id="trophy-preview">
      <div className="personal-heading">
        <p className="console-kicker">Trophy Room</p>
        <h2>A PlayStation trophy profile built from synchronized facts and manual opinions.</h2>
      </div>
      <article className="console-card trophy-preview-card">
        <div>
          <span>PSN / rgcb01</span>
          <strong>PlayStation Trophy Room</strong>
          <p>PSN provides trophy progress, IGDB provides metadata and artwork, and ratings stay manually maintained.</p>
          <div className="source-chip-row">
            <span>PSN FACTS</span>
            <span>IGDB ART</span>
            <span>LOCAL NOTES</span>
          </div>
        </div>
        <a className="trophy-room-link" href="/personal/trophies">Open Trophy Room</a>
      </article>
    </section>
  );
}
