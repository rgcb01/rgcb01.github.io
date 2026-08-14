const links = [
  { label: "Home", href: "/personal#home" },
  { label: "Trophies", href: "/personal/trophies" },
  { label: "Gaming", href: "/personal#gaming" },
  { label: "Activity", href: "/personal#activity" },
  { label: "Media", href: "/personal#media" },
  { label: "Thoughts", href: "/personal#thoughts" },
  { label: "Build Log", href: "/personal#build-log" },
  { label: "System", href: "/personal#roadmap" },
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
