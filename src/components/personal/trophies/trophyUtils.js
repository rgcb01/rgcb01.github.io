export function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

export function totalTrophies(counts = {}) {
  return ["bronze", "silver", "gold", "platinum"].reduce((sum, type) => sum + Number(counts[type] || 0), 0);
}

export function platformLabel(platforms = []) {
  if (!platforms.length) return "Platform unknown";
  return platforms.join(" / ");
}

export function byDateNewest(a, b, selector) {
  return new Date(selector(b) || 0) - new Date(selector(a) || 0);
}

export function getManualEntry(personalData, psnTitleId) {
  return personalData[psnTitleId] || {};
}

export function ratingText(value) {
  return value == null ? null : `${value}/10`;
}

export function trophyTypeLabel(type) {
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : "Unknown";
}

export async function loadJson(path) {
  try {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
