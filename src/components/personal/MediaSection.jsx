import CoverFallback from "./CoverFallback.jsx";
import { formatDate } from "./trophies/trophyUtils.js";

const CATEGORY_LABELS = {
  playing: "Playing",
  watching: "Watching",
  reading: "Reading",
  listening: "Listening",
};

function year(value) {
  return value ? new Date(value).getFullYear() : null;
}

function MediaItem({ item, category }) {
  return (
    <article className="media-item into-item">
      {item.cover ? <img src={item.cover} alt={`${item.title} cover`} loading="lazy" /> : <CoverFallback title={item.title} type={category === "watching" ? "poster" : "cover"} />}
      <div>
        <span>{CATEGORY_LABELS[category]}</span>
        <strong>{item.title}</strong>
        {item.note || item.detail ? <p>{item.note || item.detail}</p> : null}
      </div>
    </article>
  );
}

function SourceChip({ children }) {
  return <span className="media-source-chip">{children}</span>;
}

function TrackRow({ track }) {
  return (
    <a className="media-track-row" href={track.url || "/personal/media"} target={track.url ? "_blank" : undefined} rel={track.url ? "noopener noreferrer" : undefined}>
      {track.image ? <img src={track.image} alt={`${track.name} album artwork`} loading="lazy" /> : <CoverFallback title={track.name || "Track"} />}
      <div>
        <span>{track.nowPlaying ? "NOW PLAYING" : "RECENT TRACK"}</span>
        <strong>{track.name}</strong>
        <p>{[track.artist, track.album].filter(Boolean).join(" / ")}</p>
      </div>
      <SourceChip>LAST.FM</SourceChip>
    </a>
  );
}

function TopArtistTile({ artist }) {
  return (
    <a className="console-card media-small-tile" href={artist.url || "/personal/media"} target={artist.url ? "_blank" : undefined} rel={artist.url ? "noopener noreferrer" : undefined}>
      <span>TOP ARTIST</span>
      <strong>{artist.name}</strong>
      {artist.playcount ? <p>{artist.playcount} plays</p> : null}
    </a>
  );
}

function WatchCard({ item }) {
  const mediaYear = item.year || year(item.metadata?.releaseDate || item.metadata?.firstAirDate);
  return (
    <article className="console-card media-poster-card">
      {item.cover ? <img src={item.cover} alt={`${item.title} poster`} loading="lazy" /> : <CoverFallback title={item.title} type="poster" />}
      <div>
        <SourceChip>{item.source || "TMDB"}</SourceChip>
        <strong>{item.title}</strong>
        <p>{[item.type === "tv" ? "TV" : "Movie", mediaYear, item.manual?.progress || item.manual?.status].filter(Boolean).join(" / ")}</p>
        {item.manual?.rating != null ? <em>{item.manual.rating}/10</em> : null}
      </div>
    </article>
  );
}

function BookCard({ item }) {
  return (
    <article className="console-card media-poster-card book-card">
      {item.cover ? <img src={item.cover} alt={`${item.title} book cover`} loading="lazy" /> : <CoverFallback title={item.title} type="cover" />}
      <div>
        <SourceChip>{item.source || "OPEN LIBRARY"}</SourceChip>
        <strong>{item.title}</strong>
        <p>{[item.author, item.year, item.manual?.progress != null ? `${item.manual.progress}%` : item.manual?.status].filter(Boolean).join(" / ")}</p>
        {item.manual?.rating != null ? <em>{item.manual.rating}/10</em> : null}
      </div>
    </article>
  );
}

function CurrentInto({ media, recentlyPlayed, mediaData }) {
  const derivedPlaying = recentlyPlayed.slice(0, 1).map((game) => ({
    title: game.game?.title || "Recent game",
    cover: game.game?.cover || game.game?.psnIcon,
    note: "Latest PSN activity.",
  }));

  const categories = {
    playing: media.playing?.length ? media.playing : derivedPlaying,
    watching: mediaData.currentlyInto.watching,
    reading: mediaData.currentlyInto.reading,
    listening: mediaData.currentlyInto.listening,
  };
  const visible = Object.entries(categories).filter(([, items]) => items.length);
  if (!visible.length) return null;

  return (
    <section className="personal-section" id="media-current">
      <div className="personal-heading">
        <p className="console-kicker">Currently Into</p>
        <h2>One active signal from each shelf.</h2>
      </div>
      <div className="currently-into-grid">
        {visible.map(([category, items]) => (
          <article className="console-card currently-into-card" key={category}>
            <span>{CATEGORY_LABELS[category]}</span>
            {items.slice(0, 3).map((item) => (
              <MediaItem item={item} category={category} key={`${category}-${item.title}`} />
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}

function MusicSection({ music }) {
  const hasMusic = music.lastTrack || music.recentTracks.length || music.topArtists.length || music.summary?.available;
  if (!hasMusic) {
    return (
      <section className="personal-section">
        <div className="personal-heading">
          <p className="console-kicker">Music</p>
          <h2>Last.fm is ready, but not connected yet.</h2>
        </div>
        <article className="console-card route-note-card">
          <span>LAST.FM</span>
          <strong>No live listening data configured.</strong>
          <p>Add Last.fm credentials to publish recent tracks and top artists.</p>
        </article>
      </section>
    );
  }

  return (
    <section className="personal-section media-hub-section">
      <div className="personal-heading">
        <p className="console-kicker">Music</p>
        <h2>{music.lastTrack?.nowPlaying ? "Now playing." : "Last listened."}</h2>
      </div>
      <div className="media-music-layout">
        {music.lastTrack ? (
          <article className="console-card media-now-card">
            {music.lastTrack.image ? <img src={music.lastTrack.image} alt={`${music.lastTrack.name} album artwork`} loading="lazy" /> : <CoverFallback title={music.lastTrack.name || "Track"} />}
            <div>
              <SourceChip>LAST.FM</SourceChip>
              <span>{music.lastTrack.nowPlaying ? "NOW PLAYING" : "LAST LISTENED"}</span>
              <strong>{music.lastTrack.name}</strong>
              <p>{[music.lastTrack.artist, music.lastTrack.album].filter(Boolean).join(" / ")}</p>
              {music.lastTrack.date ? <em>{formatDate(music.lastTrack.date)}</em> : null}
            </div>
          </article>
        ) : null}
        {music.summary ? (
          <article className="console-card media-summary-card">
            <span>LISTENING SUMMARY</span>
            <strong>{music.username || "Last.fm"}</strong>
            {music.summary.playcount ? <p>{music.summary.playcount} total scrobbles</p> : null}
            {music.summary.topArtist ? <p>Top artist: {music.summary.topArtist}</p> : null}
            {music.summary.topAlbum ? <p>Top album: {music.summary.topAlbum}</p> : null}
          </article>
        ) : null}
      </div>
      {music.recentTracks.length ? (
        <div className="media-list-block">
          <h3>Recent Tracks</h3>
          <div className="media-track-list">
            {music.recentTracks.slice(0, 6).map((track) => <TrackRow track={track} key={`${track.name}-${track.artist}-${track.date}`} />)}
          </div>
        </div>
      ) : null}
      {music.topArtists.length ? (
        <div className="media-list-block">
          <h3>Top Artists</h3>
          <div className="media-small-grid">
            {music.topArtists.slice(0, 6).map((artist) => <TopArtistTile artist={artist} key={artist.name} />)}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function WatchingSection({ items }) {
  const current = items.filter((item) => item.manual?.status === "watching");
  const watched = items.filter((item) => ["watched", "finished"].includes(item.manual?.status));
  const favorites = items.filter((item) => item.manual?.favorite);
  if (!items.length) return null;
  return (
    <section className="personal-section media-hub-section">
      <div className="personal-heading">
        <p className="console-kicker">Watching</p>
        <h2>Manual status, TMDB metadata.</h2>
      </div>
      {current.length ? <div className="media-card-grid">{current.map((item) => <WatchCard item={item} key={`${item.type}-${item.tmdbId || item.title}`} />)}</div> : null}
      {watched.length ? (
        <div className="media-list-block">
          <h3>Recently Watched</h3>
          <div className="media-card-grid compact">{watched.slice(0, 4).map((item) => <WatchCard item={item} key={`${item.type}-${item.tmdbId || item.title}-watched`} />)}</div>
        </div>
      ) : null}
      {favorites.length ? (
        <div className="media-list-block">
          <h3>Favorites</h3>
          <div className="media-card-grid compact">{favorites.slice(0, 4).map((item) => <WatchCard item={item} key={`${item.type}-${item.tmdbId || item.title}-favorite`} />)}</div>
        </div>
      ) : null}
    </section>
  );
}

function ReadingSection({ items }) {
  const current = items.filter((item) => item.manual?.status === "reading");
  const finished = items.filter((item) => ["finished", "read"].includes(item.manual?.status));
  const favorites = items.filter((item) => item.manual?.favorite);
  if (!items.length) return null;
  return (
    <section className="personal-section media-hub-section">
      <div className="personal-heading">
        <p className="console-kicker">Reading</p>
        <h2>Manual reading state, Open Library metadata.</h2>
      </div>
      {current.length ? <div className="media-card-grid">{current.map((item) => <BookCard item={item} key={item.openLibraryKey || item.isbn || item.title} />)}</div> : null}
      {finished.length ? (
        <div className="media-list-block">
          <h3>Finished</h3>
          <div className="media-card-grid compact">{finished.slice(0, 4).map((item) => <BookCard item={item} key={`${item.openLibraryKey || item.isbn || item.title}-finished`} />)}</div>
        </div>
      ) : null}
      {favorites.length ? (
        <div className="media-list-block">
          <h3>Favorites</h3>
          <div className="media-card-grid compact">{favorites.slice(0, 4).map((item) => <BookCard item={item} key={`${item.openLibraryKey || item.isbn || item.title}-favorite`} />)}</div>
        </div>
      ) : null}
    </section>
  );
}

export default function MediaSection({ media, recentlyPlayed, mediaData }) {
  return (
    <>
      <CurrentInto media={media} recentlyPlayed={recentlyPlayed} mediaData={mediaData} />
      <MusicSection music={mediaData.music} />
      <WatchingSection items={mediaData.watching} />
      <ReadingSection items={mediaData.reading} />
      {!mediaData.watching.length && !mediaData.reading.length ? (
        <section className="personal-section">
          <article className="console-card route-note-card">
            <span>LOCAL</span>
            <strong>No watching or reading entries logged yet.</strong>
            <p>Add manual TMDB or Open Library entries when there is real media to track.</p>
          </article>
        </section>
      ) : null}
    </>
  );
}
