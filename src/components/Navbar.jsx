export default function Navbar({ navItems, resumePath }) {
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
          <a className="nav-resume" href={resumePath}>
            Resume
          </a>
        </div>
      </nav>
    </header>
  );
}
