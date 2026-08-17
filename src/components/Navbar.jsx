export default function Navbar({ navItems, resumePath }) {
  const hasResume = resumePath && !resumePath.startsWith("#");

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Primary navigation">
        <a className="brand" href="#home">
          RGCB
        </a>
        <div className="nav-links">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          <a className="nav-resume" href={resumePath} target={hasResume ? "_blank" : undefined} rel={hasResume ? "noopener noreferrer" : undefined} aria-label="Open resume PDF">
            Resume
          </a>
        </div>
      </nav>
    </header>
  );
}
