import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const indexPath = join("dist", "index.html");
const fallbackPath = join("dist", "404.html");

if (!existsSync(indexPath)) {
  throw new Error("dist/index.html was not found. Run this script after vite build.");
}

copyFileSync(indexPath, fallbackPath);
console.log("Created dist/404.html for GitHub Pages SPA fallback.");
