import raw from "./data/cities.json"

export interface City {
  id: string
  name: string
  cc: string
  country: string
  tz: string
  lat: number
  lon: number
  key: string
}

/** Never offered, never restored from storage or a shared link. */
export const EXCLUDED_COUNTRIES = new Set(["RU", "BY", "IR", "KP", "AF"])

export const MAX_EXTRA = 4
export const KYIV_ID = "kyiv-ua"

const regions = new Intl.DisplayNames(["en"], { type: "region" })
const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()

type Row = [string, string, string, string, number, number, string]

export const CITIES: City[] = (raw as Row[])
  .filter((r) => !EXCLUDED_COUNTRIES.has(r[2]))
  .map(([id, name, cc, tz, lat, lon, ascii]) => {
    const country = regions.of(cc) ?? cc
    return { id, name, cc, country, tz, lat, lon, key: norm(`${ascii} ${name} ${country}`) }
  })

const byId = new Map(CITIES.map((c) => [c.id, c]))

export const getCity = (id: string): City | undefined => byId.get(id)

export const KYIV_CITY = getCity(KYIV_ID)!

/** Keeps only known, allowed, unique ids; caps the count. Kyiv is implicit. */
export function sanitizeIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  const out: string[] = []
  for (const id of ids) {
    if (typeof id !== "string" || id === KYIV_ID || out.includes(id) || !byId.has(id)) continue
    out.push(id)
    if (out.length === MAX_EXTRA) break
  }
  return out
}

export function searchCities(query: string, exclude: string[], limit = 40): City[] {
  const q = norm(query.trim())
  const pool = CITIES.filter((c) => c.id !== KYIV_ID && !exclude.includes(c.id))
  if (!q) return pool.slice(0, 0)
  const starts: City[] = []
  const contains: City[] = []
  for (const c of pool) {
    const name = norm(c.name)
    if (name.startsWith(q)) starts.push(c)
    else if (c.key.includes(q)) contains.push(c)
    if (starts.length >= limit) break
  }
  return [...starts, ...contains].slice(0, limit)
}

/** Returns a copy of `ids` with the item at `from` moved to `to`; the same array if nothing changes. */
export function reorder<T>(ids: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return ids
  const next = ids.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
