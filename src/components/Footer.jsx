export default function Footer({ profile }) {
  return (
    <footer className="footer">
      <p>{profile.availability}</p>
      <div className="footer-links">
        <a href={`mailto:${profile.email}`}>Email</a>
        <a href={profile.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <a href={profile.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
      <p>© 2026 {profile.name}. Built with React, Vite and GitHub Pages.</p>
    </footer>
  );
}
