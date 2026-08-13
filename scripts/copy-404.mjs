import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const indexPath = join("dist", "index.html");
const fallbackPath = join("dist", "404.html");
const spaRoutes = [
  "personal",
  join("personal", "trophies"),
  join("projects", "manufacturing-oee-dashboard"),
  join("projects", "automated-visual-quality-inspection"),
  join("projects", "industrial-automation-cell-simulator"),
];

if (!existsSync(indexPath)) {
  throw new Error("dist/index.html was not found. Run this script after vite build.");
}

copyFileSync(indexPath, fallbackPath);

for (const route of spaRoutes) {
  const routeDirectory = join("dist", route);
  mkdirSync(routeDirectory, { recursive: true });
  copyFileSync(indexPath, join(routeDirectory, "index.html"));
}

console.log("Created GitHub Pages SPA fallback files for direct routes.");
