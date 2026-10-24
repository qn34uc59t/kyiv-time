// Renders the link-preview image (public/og.png, 1200x630) with system Chrome. Run: node scripts/build-og.mjs
import { chromium } from "playwright-core"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const file = (p) => fileURLToPath(new URL(p, import.meta.url))
// The header's wordmark, reused as-is so the card matches the app.
const wordmark = readFileSync(file("../index.html"), "utf8").match(/<svg class="wordmark-svg"[\s\S]*?<\/svg>/)[0]
const font = readFileSync(file("../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")).toString("base64")

// A fixed winter moment (Kyiv UTC+2), so every offset below is true for the same instant.
const rows = [
  ["Lisbon", "Portugal", "13:00", "−2h"],
  ["New York", "United States", "08:00", "−7h"],
  ["Tokyo", "Japan", "22:00", "+7h"],
]

const html = `<!doctype html><meta charset="utf-8"><style>
  @font-face { font-family: Inter; src: url(data:font/woff2;base64,${font}) format("woff2"); font-weight: 100 900; }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; background: #f6f2ec; color: #1d1a17; font-family: Inter, sans-serif;
    -webkit-font-smoothing: antialiased; font-variant-numeric: tabular-nums;
    display: grid; grid-template-columns: 1fr 440px; gap: 64px; padding: 72px 88px; }
  .left { display: flex; flex-direction: column; }
  .wordmark { width: 260px; }
  .kyiv { font-size: 196px; font-weight: 600; letter-spacing: -0.045em; line-height: 1; margin-top: auto; }
  .kyiv span { color: #ee6a58; }
  .soft { color: #6f675e; font-size: 30px; font-weight: 500; }
  .left .soft { margin-top: 20px; }
  ul { list-style: none; padding: 0; display: flex; flex-direction: column; justify-content: flex-end; gap: 34px; }
  li { display: grid; grid-template-columns: 1fr auto; align-items: baseline; }
  .name { font-size: 34px; font-weight: 500; }
  .time { font-size: 60px; font-weight: 600; letter-spacing: -0.03em; line-height: 1; grid-row: span 2; align-self: center; }
  li .soft { font-size: 24px; margin-top: 6px; }
</style>
<div class="left">
  <div class="wordmark">${wordmark}</div>
  <div class="kyiv">15<span>:</span>00</div>
  <p class="soft">Kyiv, next to your team's time</p>
</div>
<ul>${rows.map(([name, country, time, diff]) => `<li><span class="name">${name}</span><span class="time">${time}</span><span class="soft">${country} · ${diff}</span></li>`).join("")}</ul>`

const browser = await chromium.launch({ channel: "chrome", args: ["--force-color-profile=srgb"] })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: file("../public/og.png") })
await browser.close()
console.log("public/og.png written")
