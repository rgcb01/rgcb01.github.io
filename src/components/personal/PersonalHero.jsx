function formatNumber(value) {
  return new Intl.NumberFormat("en").format(value || 0);
}

const emptyTrophyData = {
  hasRealData: false,
  loading: false,
  psnOnlineId: "rgcb01",
  platinumCount: 0,
  gameCount: 0,
  totalTrophies: 0,
};

export default function PersonalHero({ profile, trophyData = emptyTrophyData }) {
  const handle = profile.handle || trophyData.psnOnlineId || "rgcb01";
  const showStats = trophyData !== emptyTrophyData;
  const statusChips = (profile.statusChips || ["ONLINE"]).filter((chip) => {
    if (chip === "PROFILE SYNCED") return trophyData.hasRealData;
    if (chip === "STEAM READY") return trophyData.steamConnected;
    return true;
  });
  const stats = [
    { label: "Platinums", value: trophyData.loading ? "Syncing" : formatNumber(trophyData.platinumCount) },
    ...(trophyData.steamConnected ? [{ label: "Steam Games", value: formatNumber(trophyData.steamSummary?.ownedGames || 0) }] : []),
    { label: "Trophies", value: trophyData.loading ? "Syncing" : formatNumber(trophyData.totalTrophies) },
    { label: "Platforms", value: formatNumber(Object.values(trophyData.platformAccounts || {}).filter((account) => account.enabled).length || 1) },
  ];

  return (
    <section className="personal-hero console-home-hero" id="home">
      <a className="personal-back" href="/">Back to professional portfolio</a>
      <div className="player-hero-shell">
        <div>
          <p className="console-kicker">Player Profile</p>
          <h1>{profile.name}</h1>
          <p className="player-handle">@{handle}</p>
          <div className="personal-manifesto">
            {profile.introLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="source-chip-row hero-status-row" aria-label="Player profile status">
            {statusChips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        </div>
        <aside className="player-status-card">
          <span>Status</span>
          <strong>{profile.status}</strong>
          <ul>
            <li>Life is the game. RGCB is the console.</li>
            <li>{trophyData.steamConnected ? "PlayStation and Steam are synced into the console home." : trophyData.hasRealData ? "PlayStation profile data loaded from the generated Trophy Room summary." : "Trophy data temporarily unavailable on this build."}</li>
            {profile.location ? <li>{profile.location}</li> : null}
          </ul>
        </aside>
      </div>
      {showStats ? (
        <div className="player-stat-grid compact">
          {stats.map((field) => (
            <div className="player-stat" key={field.label}>
              <span>{field.label}</span>
              <strong>{field.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
