export default function PlatformStatus({ accounts }) {
  const entries = Object.entries(accounts);

  return (
    <section className="personal-section platform-status-section" id="platforms" aria-label="Gaming platform status">
      <div className="platform-status-strip">
        {entries.map(([key, account]) => (
          <a
            className={`platform-status-pill ${account.enabled ? "connected" : "future"}`}
            href={account.publicProfile || "/personal#roadmap"}
            key={key}
          >
            <span>{account.label}</span>
            <strong>{account.enabled && account.username ? account.username : account.status}</strong>
          </a>
        ))}
      </div>
    </section>
  );
}
