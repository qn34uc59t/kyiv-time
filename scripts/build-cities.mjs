// Usage: node scripts/build-cities.mjs <path to GeoNames cities15000.txt>
// Data: GeoNames (CC BY 4.0), https://download.geonames.org/export/dump/
import { readFileSync, writeFileSync } from "node:fs"

const EXCLUDED = new Set(["RU", "BY", "IR", "KP", "AF"])
const TZ_FIX = { "Europe/Kiev": "Europe/Kyiv", "Europe/Uzhgorod": "Europe/Kyiv", "Europe/Zaporozhye": "Europe/Kyiv", "Europe/Simferopol": "Europe/Kyiv" }
const MIN_POP = 250_000

const src = process.argv[2]
if (!src) throw new Error("pass the path to cities15000.txt")

const valid = (tz) => { try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true } catch { return false } }

const seen = new Set()
const out = []
for (const line of readFileSync(src, "utf8").split("\n")) {
  if (!line) continue
  const c = line.split("\t")
  const [, name, ascii, , lat, lon, , fcode, cc, , , , , , pop, , , tzRaw] = c
  if (EXCLUDED.has(cc)) continue
  if (Number(pop) < MIN_POP && fcode !== "PPLC") continue
  const tz = cc === "UA" ? "Europe/Kyiv" : TZ_FIX[tzRaw] ?? tzRaw
  if (!valid(tz)) continue
  const slug = ascii.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  let id = `${slug}-${cc.toLowerCase()}`
  if (seen.has(id)) continue
  seen.add(id)
  out.push([id, name, cc, tz, Math.round(lat * 100) / 100, Math.round(lon * 100) / 100, ascii])
}
out.sort((a, b) => a[1].localeCompare(b[1]))
writeFileSync(new URL("../src/data/cities.json", import.meta.url), JSON.stringify(out))
console.log(out.length, "cities")
