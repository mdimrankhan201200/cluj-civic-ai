/**
 * Cluj Civic AI — Buildathon Presentation Generator
 * Captures live screenshots + builds a .pptx file
 */

import puppeteer from "puppeteer";
import PptxGenJS from "pptxgenjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, "screenshots");
const BASE_URL = "http://localhost:3000";

// Pages to capture
const PAGES = [
  { name: "landing",       path: "/",                       label: "Landing Page",          login: false },
  { name: "login",         path: "/login",                  label: "Login Page",            login: false },
  { name: "register",      path: "/register",               label: "Register Page",         login: false },
  { name: "dashboard",     path: "/dashboard",              label: "Citizen Dashboard",     login: true  },
  { name: "reports",       path: "/reports",                label: "My Reports",            login: true  },
  { name: "report_new",    path: "/reports/new",            label: "Submit New Report",     login: true  },
  { name: "map",           path: "/map",                    label: "Interactive Map",       login: true  },
  { name: "gov_dashboard", path: "/gov",                    label: "Gov Dashboard",         login: "gov" },
  { name: "gov_reports",   path: "/gov/reports",            label: "Gov Reports Table",     login: "gov" },
];

const CREDS = {
  citizen: { email: "ion@gmail.com",      password: "citizen123" },
  gov:     { email: "officer@cluj.ro",    password: "officer123" },
};

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// ─── Puppeteer helpers ───────────────────────────────────────────────────────

// Force English language cookie on every new page
async function setEnglish(page) {
  await page.setCookie({
    name: "locale", value: "en",
    domain: "localhost", path: "/",
    expires: Math.floor(Date.now() / 1000) + 31536000,
  });
}

async function doLogin(page, role = "citizen") {
  const creds = CREDS[role];
  await setEnglish(page);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2", timeout: 30000 });
  await page.type('input[type="email"]', creds.email, { delay: 30 });
  await page.type('input[type="password"]', creds.password, { delay: 30 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  // Re-assert English cookie after redirect (auth may clear cookies)
  await setEnglish(page);
}

async function snap(page, name, label) {
  console.log(`  📸 ${label}`);
  await new Promise(r => setTimeout(r, 1200));
  // Scroll to top before capturing
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  const file = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function captureScreenshots() {
  console.log("🚀 Launching browser…");
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--force-device-scale-factor=1"],
  });

  const results = {};

  // --- Public pages (no login) ---
  {
    const page = await browser.newPage();
    await setEnglish(page);
    for (const p of PAGES.filter((x) => !x.login)) {
      try {
        await setEnglish(page);
        await page.goto(`${BASE_URL}${p.path}`, { waitUntil: "networkidle2", timeout: 20000 });
        results[p.name] = await snap(page, p.name, p.label);
      } catch (e) { console.warn(`  ⚠️  ${p.label}: ${e.message}`); }
    }
    await page.close();
  }

  // --- Citizen pages ---
  {
    const page = await browser.newPage();
    try {
      await doLogin(page, "citizen");
      for (const p of PAGES.filter((x) => x.login === true)) {
        try {
          await setEnglish(page);
          await page.goto(`${BASE_URL}${p.path}`, { waitUntil: "networkidle2", timeout: 20000 });
          results[p.name] = await snap(page, p.name, p.label + " (citizen)");
        } catch (e) { console.warn(`  ⚠️  ${p.label}: ${e.message}`); }
      }
    } catch (e) { console.warn("  ⚠️  Citizen login failed:", e.message); }
    await page.close();
  }

  // --- Gov pages ---
  {
    const page = await browser.newPage();
    try {
      await doLogin(page, "gov");
      for (const p of PAGES.filter((x) => x.login === "gov")) {
        try {
          await setEnglish(page);
          await page.goto(`${BASE_URL}${p.path}`, { waitUntil: "networkidle2", timeout: 20000 });
          results[p.name] = await snap(page, p.name, p.label + " (gov)");
        } catch (e) { console.warn(`  ⚠️  ${p.label}: ${e.message}`); }
      }
    } catch (e) { console.warn("  ⚠️  Gov login failed:", e.message); }
    await page.close();
  }

  await browser.close();
  console.log(`✅ Screenshots done (${Object.keys(results).length}/${PAGES.length})`);
  return results;
}

// ─── PowerPoint builder ──────────────────────────────────────────────────────

function hex(h) { return h; } // passthrough helper for clarity

async function buildPptx(screenshots) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 inches

  // Palette
  const BG_DARK   = "0f172a";
  const BG_CARD   = "1e293b";
  const BLUE      = "2563eb";
  const INDIGO    = "4f46e5";
  const VIOLET    = "7c3aed";
  const MUTED     = "94a3b8";
  const WHITE     = "f1f5f9";
  const GRAD_FROM = "60a5fa";
  const GRAD_TO   = "a78bfa";

  // Shared helpers
  const eyebrow = (slide, text) =>
    slide.addText(text, { x: 0.5, y: 0.35, w: 12.33, h: 0.3, fontSize: 11, bold: true,
      color: "60a5fa", charSpacing: 3, align: "center" });

  const heading = (slide, text, y = 0.75, sz = 36) =>
    slide.addText(text, { x: 0.5, y, w: 12.33, h: 0.9, fontSize: sz, bold: true,
      color: WHITE, align: "center" });

  const subText = (slide, text, y = 1.6, color = MUTED, sz = 14) =>
    slide.addText(text, { x: 1.5, y, w: 10.33, h: 0.5, fontSize: sz,
      color, align: "center", wrap: true });

  const tag = (slide, text, x, y, color = "60a5fa", bg = "1e3a5f") => {
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: text.length * 0.1 + 1.1, h: 0.32,
      fill: { color: bg }, line: { color: bg }, rectRadius: 0.16 });
    slide.addText(text, { x, y: y + 0.04, w: text.length * 0.1 + 1.1, h: 0.24,
      fontSize: 10, bold: true, color, align: "center" });
  };

  const card = (slide, x, y, w, h, fillColor = BG_CARD) => {
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h,
      fill: { color: fillColor }, line: { color: "334155" }, rectRadius: 0.15 });
  };

  const imgOrPlaceholder = (slide, key, screenshots, x, y, w, h) => {
    if (screenshots[key] && fs.existsSync(screenshots[key])) {
      // Use "cover" so the screenshot fills the frame, cropped from the top
      slide.addImage({ path: screenshots[key], x, y, w, h,
        sizing: { type: "cover", w, h, align: "top" } });
      // Thin border overlay
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h,
        fill: { type: "none" }, line: { color: "334155", pt: 1 }, rectRadius: 0.12 });
    } else {
      card(slide, x, y, w, h, "1e293b");
      slide.addText(`[${key}]`, { x, y: y + h / 2 - 0.15, w, h: 0.3,
        fontSize: 11, color: MUTED, align: "center" });
    }
  };

  // ── SLIDE 1 — TITLE ────────────────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };
    // Glow circle
    s.addShape(pptx.ShapeType.ellipse, { x: 5.67, y: 0.6, w: 2, h: 2,
      fill: { type: "solid", color: "7c3aed", transparency: 75 }, line: { color: "7c3aed", transparency: 75 } });
    // Logo box
    s.addShape(pptx.ShapeType.roundRect, { x: 6.0, y: 0.9, w: 1.33, h: 1.33,
      fill: { type: "gradient", stops: [{ position: 0, color: BLUE }, { position: 100, color: VIOLET }] },
      line: { color: VIOLET }, rectRadius: 0.2 });
    s.addText("🏙️", { x: 6.0, y: 0.95, w: 1.33, h: 1.2, fontSize: 36, align: "center", valign: "middle" });

    eyebrow(s, "CLUJ AI BUILDATHON  2026");
    s.addText("Cluj Civic AI", { x: 0.5, y: 2.35, w: 12.33, h: 1.3, fontSize: 64, bold: true,
      color: WHITE, align: "center",
      glow: { size: 20, opacity: 0.4, color: "60a5fa" } });

    s.addText("AI-powered urban infrastructure reporting\nfor a smarter Cluj-Napoca", {
      x: 1, y: 3.7, w: 11.33, h: 0.8, fontSize: 18, color: MUTED, align: "center" });

    const tags = ["Claude Vision AI", "Next.js 15", "PostgreSQL", "Real-time Maps", "Citizen & Gov Panels"];
    const tagColors = [["60a5fa","1e3a5f"], ["c4b5fd","2d1b69"], ["86efac","14532d"], ["67e8f9","0c4a6e"], ["fcd34d","451a03"]];
    let tx = 2.4;
    tags.forEach((t, i) => {
      const [fg, bg] = tagColors[i];
      const w = t.length * 0.11 + 0.8;
      s.addShape(pptx.ShapeType.roundRect, { x: tx, y: 4.65, w, h: 0.35, fill: { color: bg }, line: { color: bg }, rectRadius: 0.17 });
      s.addText(t, { x: tx, y: 4.68, w, h: 0.28, fontSize: 10, bold: true, color: fg, align: "center" });
      tx += w + 0.2;
    });

    s.addShape(pptx.ShapeType.roundRect, { x: 4.0, y: 5.2, w: 5.33, h: 0.55,
      fill: { color: "1e293b" }, line: { color: "334155" }, rectRadius: 0.1 });
    s.addText("Built at Cluj AI Buildathon · May 2026", { x: 4.0, y: 5.28, w: 5.33, h: 0.38,
      fontSize: 12, color: MUTED, align: "center" });
  }

  // ── SLIDE 2 — PROBLEM ─────────────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };
    eyebrow(s, "THE PROBLEM");
    heading(s, "Urban infrastructure issues go unreported & unresolved", 0.75, 28);
    subText(s, "Citizens encounter daily problems — but reporting is slow, fragmented, and produces no visible action.", 1.5);

    const problems = [
      { icon: "🕳️", title: "No easy channel",       desc: "Hotlines, social posts — no systematic follow-up" },
      { icon: "📋", title: "Manual categorisation",  desc: "Every report triaged by hand — delays & misrouting" },
      { icon: "📍", title: "No location tracking",   desc: "Problems lack GPS context for dispatch" },
      { icon: "🔇", title: "Zero transparency",      desc: "Citizens never know if their report was acted on" },
      { icon: "📊", title: "No data for city hall",  desc: "Authorities can't plan maintenance budgets" },
      { icon: "⚡", title: "Critical issues missed", desc: "Hazards stay unresolved for weeks" },
    ];

    const cols = 3, rows = 2;
    const cw = 3.9, ch = 1.5, mx = 0.5, my = 2.1, gx = 0.27, gy = 0.25;
    problems.forEach((p, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = mx + col * (cw + gx), y = my + row * (ch + gy);
      card(s, x, y, cw, ch);
      s.addText(p.icon, { x, y: y + 0.18, w: cw, h: 0.5, fontSize: 22, align: "center" });
      s.addText(p.title, { x: x + 0.15, y: y + 0.68, w: cw - 0.3, h: 0.35, fontSize: 13, bold: true, color: WHITE, align: "center" });
      s.addText(p.desc,  { x: x + 0.15, y: y + 1.02, w: cw - 0.3, h: 0.38, fontSize: 10, color: MUTED, align: "center", wrap: true });
    });
  }

  // ── SLIDE 3 — SOLUTION ────────────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };
    eyebrow(s, "OUR SOLUTION");
    heading(s, "One app.  AI at the core.  City-wide impact.", 0.75, 30);
    subText(s, "Cluj Civic AI connects citizens to local government through an intelligent, photo-first reporting platform.", 1.5);

    const steps = [
      { n: "1", icon: "📸", t: "Snap a photo",                     d: "Citizen photographs a problem — pothole, broken light, water leak — with their phone." },
      { n: "2", icon: "🤖", t: "Claude Vision analyses instantly",  d: "AI classifies issue type, severity (LOW→CRITICAL), and writes a human-readable summary in seconds." },
      { n: "3", icon: "🗺️", t: "GPS-pinned & submitted",           d: "The report is geo-tagged and routed to government officers with full context already attached." },
      { n: "4", icon: "✅", t: "Track resolution in real time",     d: "Citizens follow status updates; officers log actions; the city gets aggregate analytics." },
    ];

    steps.forEach((st, i) => {
      const y = 2.1 + i * 1.15;
      card(s, 0.5, y, 12.33, 1.0);
      // Number circle
      s.addShape(pptx.ShapeType.ellipse, { x: 0.75, y: y + 0.2, w: 0.6, h: 0.6,
        fill: { type: "gradient", stops: [{ position: 0, color: BLUE }, { position: 100, color: VIOLET }] }, line: { color: VIOLET } });
      s.addText(st.n, { x: 0.75, y: y + 0.25, w: 0.6, h: 0.5, fontSize: 14, bold: true, color: WHITE, align: "center" });
      s.addText(`${st.icon} ${st.t}`, { x: 1.55, y: y + 0.12, w: 5, h: 0.38, fontSize: 14, bold: true, color: WHITE });
      s.addText(st.d,                  { x: 1.55, y: y + 0.52, w: 10.8, h: 0.4, fontSize: 11, color: MUTED, wrap: true });
    });
  }

  // ── SLIDE 4 — LANDING PAGE SCREENSHOT ────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };
    eyebrow(s, "THE PLATFORM — LANDING PAGE");
    heading(s, "A clean, modern citizen-facing homepage", 0.75, 26);
    imgOrPlaceholder(s, "landing", screenshots, 1.0, 1.6, 11.33, 5.3);
  }

  // ── SLIDE 5 — DASHBOARD ───────────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };
    eyebrow(s, "CITIZEN EXPERIENCE");
    heading(s, "Personal dashboard — at a glance", 0.75, 26);
    imgOrPlaceholder(s, "dashboard", screenshots, 1.0, 1.6, 11.33, 5.3);
  }

  // ── SLIDE 6 — SUBMIT REPORT ───────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };
    eyebrow(s, "HOW IT WORKS — SUBMIT");
    s.addText("4-step guided report submission", { x: 0.5, y: 0.75, w: 12.33, h: 0.8,
      fontSize: 28, bold: true, color: WHITE, align: "center" });

    // Left: screenshot
    imgOrPlaceholder(s, "report_new", screenshots, 0.4, 1.55, 6.5, 5.3);

    // Right: steps
    const steps = [
      { icon: "📸", t: "Upload photo",     d: "Drag-drop or camera. Claude Vision analyses it instantly." },
      { icon: "📍", t: "Pin location",     d: "GPS auto-detects or click the map to place a pin." },
      { icon: "✏️",  t: "Review details",  d: "AI pre-fills type, severity & summary — citizen can edit." },
      { icon: "🚀", t: "Submit",           d: "One tap. Report goes live in the government dashboard." },
    ];
    steps.forEach((st, i) => {
      const y = 1.6 + i * 1.3;
      card(s, 7.2, y, 5.8, 1.1);
      s.addText(st.icon, { x: 7.35, y: y + 0.2,  w: 0.6, h: 0.6, fontSize: 20, align: "center" });
      s.addText(st.t,    { x: 8.05, y: y + 0.12, w: 4.8, h: 0.38, fontSize: 13, bold: true, color: WHITE });
      s.addText(st.d,    { x: 8.05, y: y + 0.52, w: 4.8, h: 0.48, fontSize: 10, color: MUTED, wrap: true });
    });
  }

  // ── SLIDE 7 — MY REPORTS ──────────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };
    eyebrow(s, "CITIZEN EXPERIENCE — MY REPORTS");
    heading(s, "Filter by status + category — track every report", 0.75, 24);
    imgOrPlaceholder(s, "reports", screenshots, 1.0, 1.6, 11.33, 5.3);
  }

  // ── SLIDE 8 — MAP ─────────────────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };
    eyebrow(s, "INTERACTIVE MAP");
    s.addText("All reports on the map — street & satellite view", {
      x: 0.5, y: 0.75, w: 12.33, h: 0.8, fontSize: 26, bold: true, color: WHITE, align: "center" });
    imgOrPlaceholder(s, "map", screenshots, 0.4, 1.55, 8.2, 5.3);

    // Side callouts
    const pts = [
      { icon: "📍", t: "GPS-pinned",      d: "Every report carries exact lat/lng coordinates." },
      { icon: "🛰️", t: "Satellite layer", d: "Toggle between street map and Esri satellite imagery." },
      { icon: "🎨", t: "Severity colours", d: "Markers coloured LOW→CRITICAL for instant triage." },
    ];
    pts.forEach((pt, i) => {
      const y = 1.6 + i * 1.75;
      card(s, 8.8, y, 4.7, 1.5);
      s.addText(pt.icon, { x: 8.95, y: y + 0.3,  w: 0.6, h: 0.6, fontSize: 20, align: "center" });
      s.addText(pt.t,    { x: 9.65, y: y + 0.15, w: 3.6, h: 0.38, fontSize: 13, bold: true, color: WHITE });
      s.addText(pt.d,    { x: 9.65, y: y + 0.55, w: 3.6, h: 0.78, fontSize: 10, color: MUTED, wrap: true });
    });
  }

  // ── SLIDE 9 — GOV DASHBOARD ───────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };
    eyebrow(s, "GOVERNMENT PANEL");
    heading(s, "Officers see everything — analytics, reports, actions", 0.75, 24);
    imgOrPlaceholder(s, "gov_dashboard", screenshots, 0.4, 1.55, 7.5, 5.3);

    const pts = [
      { icon: "📊", t: "Charts",         d: "Issue type bar chart + severity pie chart." },
      { icon: "📋", t: "All reports",    d: "Filter, sort, update status, log officer actions." },
      { icon: "🔔", t: "Status updates", d: "Each status change is visible to the citizen instantly." },
    ];
    pts.forEach((pt, i) => {
      const y = 1.6 + i * 1.75;
      card(s, 8.1, y, 5.1, 1.5);
      s.addText(pt.icon, { x: 8.25, y: y + 0.3,  w: 0.6, h: 0.6, fontSize: 20, align: "center" });
      s.addText(pt.t,    { x: 9.0,  y: y + 0.15, w: 3.9, h: 0.38, fontSize: 13, bold: true, color: WHITE });
      s.addText(pt.d,    { x: 9.0,  y: y + 0.55, w: 3.9, h: 0.78, fontSize: 10, color: MUTED, wrap: true });
    });
  }

  // ── SLIDE 10 — AI CORE ────────────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };
    eyebrow(s, "THE AI LAYER");
    heading(s, "Powered by Claude Vision API", 0.75, 30);
    subText(s, `claude-sonnet-4-6 → structured JSON output → auto-filled form`, 1.5, "60a5fa", 13);

    // JSON block
    card(s, 0.5, 2.0, 6.2, 3.5, "0d1117");
    const jsonLines = [
      ['{', WHITE],
      ['  "issueType":      ', "7dd3fc", '"POTHOLE"', "86efac"],
      ['  "severity":       ', "7dd3fc", '"HIGH"', "86efac"],
      ['  "summary":        ', "7dd3fc", '"Deep pothole, risk of vehicle damage"', "86efac"],
      ['  "confidence":     ', "7dd3fc", '91', "fcd34d"],
      ['  "additionalNotes":', "7dd3fc", '"Temporary marking recommended"', "86efac"],
      ['}', WHITE],
    ];
    jsonLines.forEach((line, i) => {
      if (line.length === 2) {
        s.addText(line[0], { x: 0.7, y: 2.15 + i * 0.43, w: 5.8, h: 0.38, fontSize: 11, color: line[1], fontFace: "Courier New" });
      } else {
        s.addText([
          { text: line[0], options: { color: line[1] } },
          { text: line[2], options: { color: line[3] } },
          { text: ',', options: { color: WHITE } },
        ], { x: 0.7, y: 2.15 + i * 0.43, w: 5.8, h: 0.38, fontSize: 11, fontFace: "Courier New" });
      }
    });

    // Right side cards
    const items = [
      { tag: "12 Issue Types", color: "c4b5fd", bg: "2d1b69", desc: "POTHOLE · BROKEN_ROAD · SIDEWALK_DAMAGE · GARBAGE · WATER_LEAKAGE · TRAFFIC_LIGHT_DAMAGE · and 6 more" },
      { tag: "4 Severity Levels", color: "fca5a5", bg: "450a0a", desc: "LOW cosmetic → MEDIUM weeks → HIGH hazard → CRITICAL same-day" },
      { tag: "Demo Fallback", color: "86efac", bg: "14532d", desc: "Hash-based deterministic scenarios ensure the app never breaks if AI is unavailable." },
    ];
    items.forEach((it, i) => {
      const y = 2.0 + i * 1.15;
      card(s, 7.0, y, 6.2, 1.0);
      const tw = it.tag.length * 0.1 + 0.7;
      s.addShape(pptx.ShapeType.roundRect, { x: 7.15, y: y + 0.13, w: tw, h: 0.28, fill: { color: it.bg }, line: { color: it.bg }, rectRadius: 0.14 });
      s.addText(it.tag, { x: 7.15, y: y + 0.15, w: tw, h: 0.24, fontSize: 9, bold: true, color: it.color, align: "center" });
      s.addText(it.desc, { x: 7.15, y: y + 0.47, w: 5.9, h: 0.44, fontSize: 10, color: MUTED, wrap: true });
    });
  }

  // ── SLIDE 11 — TECH STACK ─────────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };
    eyebrow(s, "TECHNOLOGY STACK");
    heading(s, "Production-grade full-stack architecture", 0.75, 28);

    const techs = [
      { icon: "⚛️",  name: "Next.js 15",      role: "App Router + TypeScript" },
      { icon: "🧠",  name: "Claude Sonnet",    role: "Vision AI Analysis" },
      { icon: "🔐",  name: "NextAuth v5",      role: "JWT Auth + Roles" },
      { icon: "🗄️", name: "PostgreSQL",        role: "Prisma ORM" },
      { icon: "☁️",  name: "Cloudinary",       role: "Image Storage & CDN" },
      { icon: "🗺️", name: "Leaflet + OSM",     role: "Interactive Maps" },
      { icon: "📊",  name: "Recharts",          role: "Analytics Charts" },
      { icon: "✉️",  name: "Nodemailer",        role: "Password Reset Emails" },
      { icon: "🎨",  name: "Tailwind + shadcn", role: "UI Components" },
      { icon: "✅",  name: "Zod + RHF",         role: "Validation & Forms" },
      { icon: "🌍",  name: "i18n Ready",         role: "Multi-language Support" },
      { icon: "📡",  name: "pm2",               role: "Persistent Server" },
    ];

    const cw = 2.8, ch = 1.15, cols = 4, mx = 0.5, my = 1.8, gx = 0.27, gy = 0.2;
    techs.forEach((t, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = mx + col * (cw + gx), y = my + row * (ch + gy);
      card(s, x, y, cw, ch);
      s.addText(t.icon, { x, y: y + 0.12, w: cw, h: 0.48, fontSize: 20, align: "center" });
      s.addText(t.name, { x: x + 0.1, y: y + 0.6,  w: cw - 0.2, h: 0.3, fontSize: 12, bold: true, color: WHITE, align: "center" });
      s.addText(t.role, { x: x + 0.1, y: y + 0.87, w: cw - 0.2, h: 0.24, fontSize: 9,  color: MUTED, align: "center" });
    });
  }

  // ── SLIDE 12 — ROADMAP ────────────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };
    eyebrow(s, "WHAT'S NEXT");
    heading(s, "Roadmap to a full city platform", 0.75, 28);

    const phases = [
      {
        label: "✅ Phase 1 — MVP (Done)", color: "60a5fa", bg: "1e3a5f",
        items: ["Citizen photo reporting", "Claude Vision AI classification", "Government dashboard", "GPS maps (Street + Satellite)", "Report editing & deletion", "Forgot password + email", "Account management", "Category & status filtering", "Analytics charts"],
      },
      {
        label: "🔜 Phase 2 — Q3 2026", color: "c4b5fd", bg: "2d1b69",
        items: ["Push / SMS notifications", "Mobile PWA (installable)", "Duplicate report detection", "Heat-map density view", "Officer assignment & teams", "Public report feed", "Multi-language (RO / HU / EN)"],
      },
      {
        label: "🚀 Phase 3 — 2027", color: "86efac", bg: "14532d",
        items: ["Predictive maintenance AI", "Integration with Cluj City API", "Resident satisfaction surveys", "Budget allocation AI", "Open data export", "Multi-city rollout (Romania)"],
      },
    ];

    phases.forEach((ph, i) => {
      const x = 0.5 + i * 4.27;
      card(s, x, 1.7, 4.1, 5.6);
      const tw = ph.label.length * 0.095 + 0.4;
      s.addShape(pptx.ShapeType.roundRect, { x: x + 0.15, y: 1.85, w: Math.min(tw, 3.8), h: 0.3,
        fill: { color: ph.bg }, line: { color: ph.bg }, rectRadius: 0.15 });
      s.addText(ph.label, { x: x + 0.15, y: 1.87, w: Math.min(tw, 3.8), h: 0.26,
        fontSize: 9, bold: true, color: ph.color, align: "center" });
      ph.items.forEach((item, j) => {
        s.addText(`→ ${item}`, { x: x + 0.2, y: 2.28 + j * 0.52, w: 3.7, h: 0.4,
          fontSize: 10.5, color: MUTED });
      });
    });
  }

  // ── SLIDE 13 — THANK YOU ──────────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };
    // Glow
    s.addShape(pptx.ShapeType.ellipse, { x: 4.5, y: 1.5, w: 4.33, h: 4.33,
      fill: { type: "solid", color: "2563eb", transparency: 85 }, line: { color: "2563eb", transparency: 85 } });
    s.addShape(pptx.ShapeType.ellipse, { x: 6.5, y: 2.5, w: 2.5, h: 2.5,
      fill: { type: "solid", color: VIOLET, transparency: 80 }, line: { color: VIOLET, transparency: 80 } });

    eyebrow(s, "CLUJ AI BUILDATHON 2026");
    s.addText("Thank you! 🏙️", { x: 0.5, y: 1.1, w: 12.33, h: 1.0, fontSize: 52, bold: true, color: WHITE, align: "center" });
    s.addText("Let's build a smarter Cluj.", { x: 0.5, y: 2.1, w: 12.33, h: 0.8, fontSize: 34, bold: true, color: "60a5fa", align: "center" });
    s.addText("Cluj Civic AI proves that AI + civic tech can meaningfully\nimprove quality of life — one photo at a time.", {
      x: 1.5, y: 3.0, w: 10.33, h: 0.9, fontSize: 16, color: MUTED, align: "center" });

    const links = [
      { icon: "🚀", t: "Live Demo",       u: "localhost:3000" },
      { icon: "📸", t: "Submit Report",   u: "localhost:3000/reports/new" },
      { icon: "🗺️", t: "View Map",        u: "localhost:3000/map" },
    ];
    links.forEach((lk, i) => {
      const x = 2.2 + i * 3.1;
      s.addShape(pptx.ShapeType.roundRect, { x, y: 4.05, w: 2.8, h: 0.6,
        fill: i === 0
          ? { type: "gradient", stops: [{ position: 0, color: BLUE }, { position: 100, color: VIOLET }] }
          : { color: "1e293b" },
        line: { color: i === 0 ? VIOLET : "334155" }, rectRadius: 0.1 });
      s.addText(`${lk.icon} ${lk.t}`, { x, y: 4.1, w: 2.8, h: 0.5, fontSize: 13, bold: true, color: WHITE, align: "center" });
    });

    const cards3 = [
      { icon: "🤖", name: "Claude Sonnet 4.6",      role: "Anthropic Vision API" },
      { icon: "⚡", name: "Next.js 15 + TypeScript", role: "Production-ready stack" },
      { icon: "🌍", name: "Open Infrastructure",      role: "OpenStreetMap + OSS" },
    ];
    cards3.forEach((c, i) => {
      const x = 2.2 + i * 3.1;
      card(s, x, 4.85, 2.8, 1.3);
      s.addText(c.icon, { x, y: 4.95, w: 2.8, h: 0.45, fontSize: 18, align: "center" });
      s.addText(c.name, { x: x + 0.1, y: 5.42, w: 2.6, h: 0.3, fontSize: 11, bold: true, color: WHITE, align: "center" });
      s.addText(c.role, { x: x + 0.1, y: 5.73, w: 2.6, h: 0.28, fontSize: 9, color: MUTED, align: "center" });
    });

    s.addText("misukkhanimran@gmail.com", { x: 0.5, y: 6.9, w: 12.33, h: 0.4, fontSize: 12, color: MUTED, align: "center" });
  }

  // ── Write file ─────────────────────────────────────────────────────────────
  const outPath = path.join(__dirname, "ClujCivicAI_Buildathon.pptx");
  await pptx.writeFile({ fileName: outPath });
  console.log(`\n🎉 PowerPoint saved → ${outPath}`);
  return outPath;
}

// ─── Main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log("═══════════════════════════════════════════════");
  console.log(" Cluj Civic AI — Buildathon PPT Generator");
  console.log("═══════════════════════════════════════════════\n");

  let screenshots = {};
  try {
    screenshots = await captureScreenshots();
  } catch (e) {
    console.warn("⚠️  Screenshot capture failed, building PPT without live images:", e.message);
  }

  const pptPath = await buildPptx(screenshots);
  console.log("\nDone! Open the .pptx file to review.");
  process.exit(0);
})();
