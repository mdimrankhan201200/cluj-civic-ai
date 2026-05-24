import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import path from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const TARGET_URL = process.argv[2] ?? "http://localhost:3000";
const BASE_URL   = "http://localhost:3000";

const browser = await puppeteer.launch({
  headless: true,
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();

// Set English locale cookie
await page.setCookie({ name: "locale", value: "en", domain: "localhost", path: "/" });

// Login as gov officer
console.log("Logging in as officer@cluj.ro…");
await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
await page.type('input[type="email"]', "officer@cluj.ro", { delay: 30 });
await page.type('input[type="password"]', "officer123", { delay: 30 });
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
  page.click('button[type="submit"]'),
]);
await page.setCookie({ name: "locale", value: "en", domain: "localhost", path: "/" });

console.log(`Navigating to ${TARGET_URL}…`);
await page.goto(TARGET_URL, { waitUntil: "networkidle2", timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 300));

const outFile = path.join(__dirname, "../presentation/screenshots/custom_page.png");
await page.screenshot({ path: outFile, fullPage: true });
console.log(`✅ Screenshot saved → ${outFile}`);

await browser.close();
