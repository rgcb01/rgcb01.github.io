const links = [
  { label: "Profile", href: "/personal#profile" },
  { label: "Trophy Room", href: "/personal/trophies" },
  { label: "Gaming", href: "/personal#gaming" },
  { label: "Notes", href: "/personal#player-notes" },
  { label: "Media", href: "/personal#media" },
  { label: "Devlog", href: "/personal#devlog" },
  { label: "Roadmap", href: "/personal#roadmap" },
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
