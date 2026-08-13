export default function CoverFallback({ title, type = "cover" }) {
  const initials = title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className={`cover-fallback ${type}`} aria-label={`${title} cover placeholder`} role="img">
      <span>{initials || "?"}</span>
      <small>{title}</small>
    </div>
  );
}
