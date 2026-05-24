import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:3000';
const OUTPUT_PATH = path.join('C:\\Users\\mdimr\\Desktop', 'cluj_eye_demo_backup.mp4');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function typeSlowly(page, selector, text, delay = 60) {
  await page.click(selector);
  for (const char of text) {
    await page.type(selector, char, { delay });
  }
}

(async () => {
  console.log('🎬 Starting Cluj Eye demo recording...');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: 'C:\\Users\\mdimr\\Desktop\\',
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  // ── SCENE 1: Landing page ──────────────────────────────────────────
  console.log('📸 Scene 1: Landing page');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await sleep(3000);

  // ── SCENE 2: Login page ────────────────────────────────────────────
  console.log('📸 Scene 2: Login');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await sleep(2000);

  // Click the Citizen demo button if it exists, otherwise fill manually
  const demoBtn = page.locator('button:has-text("Citizen"), button:has-text("cetățean"), button:has-text("Demo")').first();
  const demoBtnVisible = await demoBtn.isVisible().catch(() => false);

  if (demoBtnVisible) {
    await demoBtn.click();
    await sleep(1500);
  } else {
    await typeSlowly(page, 'input[type="email"], input[name="email"]', 'citizen@cluj.ro');
    await sleep(500);
    await typeSlowly(page, 'input[type="password"], input[name="password"]', 'password123');
    await sleep(500);
  }

  await page.keyboard.press('Enter');
  await sleep(3000);

  // ── SCENE 3: Citizen dashboard ────────────────────────────────────
  console.log('📸 Scene 3: Dashboard');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await sleep(3500);

  // Scroll down to show stats
  await page.evaluate(() => window.scrollBy(0, 300));
  await sleep(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1000);

  // ── SCENE 4: Reports list ─────────────────────────────────────────
  console.log('📸 Scene 4: Reports list');
  await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle' });
  await sleep(3000);

  // ── SCENE 5: Map view ─────────────────────────────────────────────
  console.log('📸 Scene 5: Map');
  await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle' });
  await sleep(4000);

  // ── SCENE 6: New report form ──────────────────────────────────────
  console.log('📸 Scene 6: New report form');
  await page.goto(`${BASE_URL}/reports/new`, { waitUntil: 'networkidle' });
  await sleep(3000);

  // ── SCENE 7: Transparency / public page ──────────────────────────
  console.log('📸 Scene 7: Transparency page');
  await page.goto(`${BASE_URL}/transparency`, { waitUntil: 'networkidle' });
  await sleep(3000);
  await page.evaluate(() => window.scrollBy(0, 400));
  await sleep(2000);

  // ── SCENE 8: Gov dashboard (login as gov) ────────────────────────
  console.log('📸 Scene 8: Gov dashboard');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await sleep(1500);

  const govBtn = page.locator('button:has-text("Gov"), button:has-text("Officer"), button:has-text("guvern")').first();
  const govBtnVisible = await govBtn.isVisible().catch(() => false);
  if (govBtnVisible) {
    await govBtn.click();
    await sleep(1500);
    await page.keyboard.press('Enter');
    await sleep(3000);
  }

  await page.goto(`${BASE_URL}/gov`, { waitUntil: 'networkidle' });
  await sleep(3500);

  // Scroll to show charts
  await page.evaluate(() => window.scrollBy(0, 300));
  await sleep(2000);

  // ── SCENE 9: Gov reports table ───────────────────────────────────
  console.log('📸 Scene 9: Gov reports table');
  await page.goto(`${BASE_URL}/gov/reports`, { waitUntil: 'networkidle' });
  await sleep(3000);

  // ── END ───────────────────────────────────────────────────────────
  console.log('🎬 Recording complete — saving video...');
  await sleep(2000);

  await context.close();
  await browser.close();

  console.log(`✅ Video saved to Desktop as cluj_eye_demo_backup.mp4`);
  console.log(`📁 Check: C:\\Users\\mdimr\\Desktop\\`);
})();
