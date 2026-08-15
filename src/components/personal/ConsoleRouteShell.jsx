import PersonalNav from "./PersonalNav.jsx";

export default function ConsoleRouteShell({ kicker, title, subtitle, children }) {
  return (
    <main className="personal-page console-route-page">
      <section className="personal-hero gaming-hub-hero" id="home">
        <a className="personal-back" href="/personal">Back to Console Home</a>
        <p className="console-kicker">{kicker}</p>
        <h1>{title}</h1>
        {subtitle ? <p className="player-handle">{subtitle}</p> : null}
      </section>
      <PersonalNav />
      {children}
    </main>
  );
}
