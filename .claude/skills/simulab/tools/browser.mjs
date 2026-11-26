// Chrome for the tools. Order: $CHROME_PATH, system Chrome (Linux or Mac), else Playwright's own
// Chromium (on a new machine run once: npx playwright install chromium).
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
export function launch() {
  const sys = ['/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => existsSync(p));
  return chromium.launch({ executablePath: process.env.CHROME_PATH || sys, args: ['--no-sandbox', '--disable-gpu'] });
}
