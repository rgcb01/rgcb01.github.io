const links = [
  { label: "HOME", href: "/personal" },
  { label: "GAMING", href: "/personal/gaming" },
  { label: "TROPHIES", href: "/personal/trophies" },
  { label: "ACTIVITY", href: "/personal/activity" },
  { label: "MEDIA", href: "/personal/media" },
  { label: "THOUGHTS", href: "/personal/thoughts" },
  { label: "BUILDS", href: "/personal/builds" },
  { label: "SYSTEM", href: "/personal/system" },
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
