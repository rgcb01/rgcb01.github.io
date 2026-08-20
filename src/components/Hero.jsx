import { ArrowRight, Github, Linkedin, Mail } from "lucide-react";

export default function Hero({ profile, badges }) {
  const hasResume = profile.resumePath && !profile.resumePath.startsWith("#");
  const focusItems = profile.heroPanel.items.slice(0, 5);

  return (
    <section className="hero section section-wide" id="home">
      <div className="hero-cover">
        <div className="hero-index" aria-hidden="true">01 / Engineering Profile</div>
        <div className="hero-content">
          <p className="eyebrow">Mechatronics Engineering Portfolio</p>
          <h1>{profile.name}</h1>
          <p className="hero-subtitle">{profile.headline}</p>
        </div>
        <aside className="hero-focus" aria-label="Current engineering focus">
          <img className="profile-photo" src={profile.photo} alt={profile.photoAlt} loading="eager" />
          <p className="panel-label">{profile.heroPanel.label}</p>
          <strong>{profile.heroPanel.title}</strong>
          <ul>
            {focusItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="hero-rule" aria-hidden="true" />

      <div className="hero-lower">
        <p className="hero-description">{profile.summary}</p>
        <div className="hero-lower-panel">
          <div className="hero-badges" aria-label="Professional credentials and focus areas">
            {badges.map((badge) => (
              <span className="proof-chip" key={badge}>
                {badge}
              </span>
            ))}
          </div>
        </div>
        <div className="hero-actions" aria-label="Portfolio actions">
          <a className="button primary" href="#projects">
            View Projects <ArrowRight size={18} />
          </a>
          <a className="button secondary" href={profile.resumePath} target={hasResume ? "_blank" : undefined} rel={hasResume ? "noopener noreferrer" : undefined} aria-label="Open Romulo Colorado resume PDF">
            {profile.resumeLabel || "View Resume"}
          </a>
          <a className="icon-link" href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile">
            <Github size={21} />
          </a>
          <a className="icon-link" href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile">
            <Linkedin size={21} />
          </a>
          <a className="icon-link" href={`mailto:${profile.email}`} aria-label="Email">
            <Mail size={21} />
          </a>
        </div>
      </div>
    </section>
  );
}
