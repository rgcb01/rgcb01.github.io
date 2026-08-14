export default function Footer({ profile }) {
  const availabilityText = typeof profile.availability === "string" ? profile.availability : profile.availability?.text;
  const showAvailability = typeof profile.availability === "string" || profile.availability?.visible;
  const hasResume = profile.resumePath && !profile.resumePath.startsWith("#");

  return (
    <footer className="footer">
      {showAvailability && <p>{availabilityText}</p>}
      <div className="footer-links">
        <a href={`mailto:${profile.email}`}>Email</a>
        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
        <a href={profile.resumePath} target={hasResume ? "_blank" : undefined} rel={hasResume ? "noopener noreferrer" : undefined}>
          Resume
        </a>
        <a href={profile.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </div>
      <a className="personal-entry" href="/personal">
        Off the clock →
      </a>
      <p>© 2026 {profile.name}. Built with React, Vite and GitHub Pages.</p>
    </footer>
  );
}
