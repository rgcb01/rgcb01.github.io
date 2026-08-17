import CoverFallback from "./CoverFallback.jsx";
import { formatDate, platformLabel } from "./trophies/trophyUtils.js";

function formatNumber(value) {
  return new Intl.NumberFormat("en").format(value || 0);
}

function formatHours(value) {
  const numeric = Number(value || 0);
  if (numeric >= 1000) return `${formatNumber(Math.round(numeric))} h`;
  return `${numeric.toFixed(numeric >= 10 ? 0 : 1)} h`;
}

function gameTitle(game) {
  return game?.game?.title || game?.name || "Game file";
}

function gameCover(game) {
  return game?.game?.cover || game?.game?.psnIcon || game?.cover || game?.logoUrl || game?.iconUrl || "";
}

function latestBuild(devlogEntries) {
  return devlogEntries.slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0] || null;
}

function currentMediaItems(media, recentlyPlayed) {
  const derivedPlaying = recentlyPlayed[0]
    ? [{
        category: "Playing",
        title: recentlyPlayed[0].game?.title || "Recent game",
        detail: "Latest PSN activity",
        cover: recentlyPlayed[0].game?.cover || recentlyPlayed[0].game?.psnIcon,
        href: `/personal/trophies/${recentlyPlayed[0].slug}`,
      }]
    : [];
  return [
    ...(media.playing || []).slice(0, 1).map((item) => ({ category: "Playing", detail: item.note, href: "/personal/media", ...item })),
    ...(!media.playing?.length ? derivedPlaying : []),
    ...(media.watching || []).slice(0, 1).map((item) => ({ category: "Watching", detail: item.note, href: "/personal/media", ...item })),
    ...(media.reading || []).slice(0, 1).map((item) => ({ category: "Reading", detail: item.note, href: "/personal/media", ...item })),
    ...(media.listening || []).slice(0, 1).map((item) => ({ category: "Listening", detail: item.note, href: "/personal/media", ...item })),
  ].slice(0, 4);
}

function continueItems({ trophyData, media, devlogEntries }) {
  const items = [];
  const steamRecent = trophyData.recentSteamGames?.[0];
  const huntPlatform = platformLabel(trophyData.currentHunt?.game?.platforms);
  const playing = trophyData.currentHunt
    ? {
        label: "Playing",
        title: gameTitle(trophyData.currentHunt),
        detail: `${huntPlatform} / Current hunt`,
        href: `/personal/trophies/${trophyData.currentHunt.slug}`,
        cover: gameCover(trophyData.currentHunt),
      }
    : steamRecent
      ? {
          label: "Playing",
          title: steamRecent.name,
          detail: `Steam / ${formatHours(steamRecent.recentPlaytimeHours || steamRecent.playtimeHours)} recent`,
          href: "/personal/gaming",
          cover: gameCover(steamRecent),
        }
      : null;
  if (playing) items.push(playing);

  const build = latestBuild(devlogEntries);
  if (build) {
    items.push({
      label: "Building",
      title: build.project || "Build Log",
      detail: build.title,
      href: "/personal/builds",
    });
  }

  for (const item of currentMediaItems(media, [])) {
    if (items.length >= 4) break;
    items.push({
      label: item.category,
      title: item.title,
      detail: item.detail,
      href: item.href || "/personal/media",
      cover: item.cover,
    });
  }

  return items.slice(0, 4);
}

function trophyStats(trophyData) {
  return [
    { label: "Platinums", value: formatNumber(trophyData.platinumCount) },
    { label: "Trophies", value: formatNumber(trophyData.totalTrophies) },
    { label: "PSN Games", value: formatNumber(trophyData.gameCount) },
    { label: "Steam", value: trophyData.steamConnected ? formatNumber(trophyData.steamSummary?.ownedGames) : "Offline" },
  ];
}

function latestAchievement(trophyData, milestones) {
  const latestPlatinum = trophyData.latestPlatinum;
  const perfectSteam = trophyData.steamGames
    ?.filter((game) => game.achievements?.perfect && game.achievements?.latestUnlock)
    .sort((a, b) => new Date(b.achievements.latestUnlock) - new Date(a.achievements.latestUnlock))[0];

  if (latestPlatinum && (!perfectSteam || new Date(latestPlatinum.trophyProgress?.platinumEarnedDate || 0) >= new Date(perfectSteam.achievements.latestUnlock || 0))) {
    return {
      source: "PSN",
      title: latestPlatinum.game?.title || "Latest platinum",
      detail: latestPlatinum.trophyProgress?.platinumTrophyName || "Platinum earned",
      date: latestPlatinum.trophyProgress?.platinumEarnedDate,
      href: "/personal/trophies",
      cta: "Open Trophy Room",
      cover: latestPlatinum.game?.cover || latestPlatinum.game?.psnIcon,
    };
  }

  if (perfectSteam) {
    return {
      source: "STEAM",
      title: perfectSteam.name,
      detail: `${perfectSteam.achievements.earned}/${perfectSteam.achievements.total} achievements`,
      date: perfectSteam.achievements.latestUnlock,
      href: "/personal/gaming",
      cta: "Open Gaming Hub",
      cover: perfectSteam.cover || perfectSteam.logoUrl || perfectSteam.iconUrl,
    };
  }

  const milestone = milestones.find((item) => item.unlocked);
  return milestone ? {
    source: "SYSTEM",
    title: milestone.title,
    detail: milestone.description,
    href: "/personal/system",
    cta: "Open System",
  } : null;
}

function ContinueCard({ item }) {
  return (
    <a className="console-card continue-card" href={item.href}>
      {item.cover ? <img src={item.cover} alt={`${item.title} cover`} loading="lazy" /> : <CoverFallback title={item.title} />}
      <div>
        <span>{item.label}</span>
        <strong>{item.title}</strong>
        {item.detail ? <p>{item.detail}</p> : null}
      </div>
    </a>
  );
}

export function TrophyGamingOverviewWidget({ trophyData }) {
  const latest = trophyData.latestPlatinum;
  const hunt = trophyData.currentHunt;
  const sourceLabel = trophyData.hasRealData
    ? "Synced from PSN / metadata via IGDB"
    : "Waiting for live sync data";

  return (
    <section className="personal-section console-home-band trophy-gaming-overview" aria-label="Trophy and gaming status">
      <div className="personal-heading compact-heading">
        <p className="console-kicker">Gaming Status</p>
        <h2>PlayStation-first progress, with Steam context.</h2>
      </div>
      <div className="trophy-gaming-grid">
        <article className="console-card trophy-status-panel">
          <div className="trophy-status-header">
            <span>{sourceLabel}</span>
            <strong>Trophy Room snapshot</strong>
          </div>
          <div className="trophy-mini-stat-grid">
            {trophyStats(trophyData).map((stat) => (
              <div className="trophy-mini-stat" key={stat.label}>
                <b>{stat.value}</b>
                <em>{stat.label}</em>
              </div>
            ))}
          </div>
          <div className="trophy-status-actions">
            <a href="/personal/trophies">Open Trophy Room</a>
            <a href="/personal/gaming">Open Gaming Hub</a>
          </div>
        </article>
        <article className="console-card trophy-highlight-panel">
          {latest ? (
            <>
              {gameCover(latest) ? <img src={gameCover(latest)} alt={`${gameTitle(latest)} cover`} loading="lazy" /> : <CoverFallback title={gameTitle(latest)} />}
              <div>
                <span>Latest Platinum</span>
                <strong>{gameTitle(latest)}</strong>
                <p>{latest.trophyProgress?.platinumTrophyName || "Platinum earned"}</p>
                {latest.trophyProgress?.platinumEarnedDate ? <em>{formatDate(latest.trophyProgress.platinumEarnedDate)}</em> : null}
              </div>
            </>
          ) : (
            <div className="trophy-empty-state">
              <span>Latest Platinum</span>
              <strong>No synced platinum yet</strong>
              <p>The slot fills from generated PSN timestamps after sync.</p>
            </div>
          )}
        </article>
        <article className="console-card trophy-highlight-panel">
          {hunt ? (
            <>
              {gameCover(hunt) ? <img src={gameCover(hunt)} alt={`${gameTitle(hunt)} cover`} loading="lazy" /> : <CoverFallback title={gameTitle(hunt)} />}
              <div>
                <span>Current Hunt</span>
                <strong>{gameTitle(hunt)}</strong>
                <p>{hunt.trophyProgress?.progressPercent ?? 0}% complete</p>
                <a href={`/personal/trophies/${hunt.slug}`}>Open file</a>
              </div>
            </>
          ) : (
            <div className="trophy-empty-state">
              <span>Current Hunt</span>
              <strong>No manual hunt selected</strong>
              <p>Set one in personal data when there is a clear active target.</p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export function ContinueWidget({ trophyData, media, devlogEntries }) {
  const items = continueItems({ trophyData, media, devlogEntries });
  if (!items.length) return null;
  return (
    <section className="console-home-block continue-widget">
      <div className="personal-heading compact-heading">
        <p className="console-kicker">Continue</p>
        <h2>Resume the current threads.</h2>
      </div>
      <div className="continue-grid">
        {items.map((item) => <ContinueCard item={item} key={`${item.label}-${item.title}`} />)}
      </div>
    </section>
  );
}

export function LatestAchievementWidget({ trophyData }) {
  const achievement = latestAchievement(trophyData, trophyData.milestones || []);
  if (!achievement) return null;
  return (
    <section className="console-home-block latest-achievement-widget">
      <div className="personal-heading compact-heading">
        <p className="console-kicker">Latest Achievement</p>
        <h2>Most meaningful recent unlock.</h2>
      </div>
      <article className="console-card achievement-feature-card">
        {achievement.cover ? <img src={achievement.cover} alt={`${achievement.title} cover`} loading="lazy" /> : <CoverFallback title={achievement.title} />}
        <div>
          <span>{achievement.source}</span>
          <strong>{achievement.title}</strong>
          <p>{achievement.detail}</p>
          {achievement.date ? <em>{formatDate(achievement.date)}</em> : null}
          <a href={achievement.href}>{achievement.cta}</a>
        </div>
      </article>
    </section>
  );
}

export function CurrentlyIntoPreview({ media, recentlyPlayed }) {
  const items = currentMediaItems(media, recentlyPlayed);
  if (!items.length) return null;
  return (
    <section className="personal-section console-home-band">
      <div className="personal-heading compact-heading">
        <p className="console-kicker">Currently Into</p>
        <h2>Only the current item from each shelf.</h2>
      </div>
      <div className="home-current-grid">
        {items.map((item) => (
          <a className="console-card home-current-item" href={item.href || "/personal/media"} key={`${item.category}-${item.title}`}>
            {item.cover ? <img src={item.cover} alt={`${item.title} cover`} loading="lazy" /> : <CoverFallback title={item.title} />}
            <div>
              <span>{item.category}</span>
              <strong>{item.title}</strong>
              {item.detail ? <p>{item.detail}</p> : null}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export function RecentActivityPreview({ events }) {
  const visible = events.slice(0, 5);
  if (!visible.length) return null;
  return (
    <section className="console-home-block">
      <div className="personal-heading compact-heading">
        <p className="console-kicker">Recent Activity</p>
        <h2>The last signals.</h2>
      </div>
      <div className="activity-feed home-activity-feed">
        {visible.map((event) => (
          <a className={`activity-row ${event.type}`} href={event.href || "/personal/activity"} key={`${event.source}-${event.title}-${event.date}`}>
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
        ))}
      </div>
      <a className="console-action-link" href="/personal/activity">View All Activity</a>
    </section>
  );
}

export function ConsoleApps({ trophyData, devlogEntries, thoughts }) {
  const apps = [
    { name: "Gaming", description: "PlayStation + Steam", status: trophyData.steamConnected ? `${formatNumber(trophyData.steamSummary?.ownedGames)} Steam games` : "Cross-platform hub", href: "/personal/gaming" },
    { name: "Trophy Room", description: "PlayStation trophy files", status: `${formatNumber(trophyData.platinumCount)} platinums`, href: "/personal/trophies" },
    { name: "Media", description: "Current games, watching, reading and listening", status: "Manual shelf", href: "/personal/media" },
    { name: "Activity", description: "Timeline across console signals", status: `${trophyData.activity.length} recent`, href: "/personal/activity" },
    { name: "Player Thoughts", description: "Short notes and observations", status: thoughts.length ? `${thoughts.length} notes` : "Quiet", href: "/personal/thoughts" },
    { name: "Build Log", description: "Projects and experiments", status: `${devlogEntries.length} entries`, href: "/personal/builds" },
    { name: "System", description: "Connections, roadmap and milestones", status: "Status", href: "/personal/system" },
  ];

  return (
    <section className="console-home-block console-apps-widget">
      <div className="personal-heading compact-heading">
        <p className="console-kicker">Console Apps</p>
        <h2>Launch deeper sections.</h2>
      </div>
      <div className="console-app-grid">
        {apps.map((app) => (
          <a className="console-app-tile" href={app.href} key={app.name}>
            <span>{app.status}</span>
            <strong>{app.name}</strong>
            <p>{app.description}</p>
            <em>Open</em>
          </a>
        ))}
      </div>
    </section>
  );
}
