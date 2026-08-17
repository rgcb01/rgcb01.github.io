const links = [
  { label: "Home", href: "/personal" },
  { label: "Gaming", href: "/personal/gaming" },
  { label: "Trophies", href: "/personal/trophies" },
  { label: "Activity", href: "/personal/activity" },
  { label: "Media", href: "/personal/media" },
  { label: "Thoughts", href: "/personal/thoughts" },
  { label: "Builds", href: "/personal/builds" },
  { label: "System", href: "/personal/system" },
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
