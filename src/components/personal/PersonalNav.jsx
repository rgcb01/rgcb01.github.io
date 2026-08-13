const links = [
  { label: "Profile", href: "#profile" },
  { label: "Gaming", href: "#gaming" },
  { label: "Notes", href: "#player-notes" },
  { label: "Media", href: "#media" },
  { label: "Devlog", href: "#devlog" },
  { label: "Roadmap", href: "#roadmap" },
];

export default function PersonalNav() {
  return (
    <nav className="personal-nav" aria-label="Personal page navigation">
      {links.map((link) => (
        <a href={link.href} key={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}
