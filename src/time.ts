// Older engines only know the pre-2022 name.
function resolveKyiv(): string {
  try {
    new Intl.DateTimeFormat("en", { timeZone: "Europe/Kyiv" })
    return "Europe/Kyiv"
  } catch {
    return "Europe/Kiev"
  }
}

export const KYIV = resolveKyiv()

const cache = new Map<string, Intl.DateTimeFormat>()

function fmt(zone: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = zone + JSON.stringify(opts)
  let f = cache.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", { timeZone: zone, ...opts })
    cache.set(key, f)
  }
  return f
}

export function formatTime(at: Date, zone: string): string {
  return fmt(zone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(at)
}

export function formatShortDate(at: Date, zone: string): string {
  return fmt(zone, { weekday: "short", day: "numeric", month: "short" }).format(at)
}

export interface Clock { h: string; m: string; suffix: string }

export function formatClock(at: Date, zone: string, hour12: boolean): Clock {
  if (!hour12) {
    const [h, m] = formatTime(at, zone).split(":")
    return { h, m, suffix: "" }
  }
  const p = fmt(zone, { hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(at)
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? ""
  return { h: get("hour"), m: get("minute"), suffix: get("dayPeriod").toUpperCase() }
}

export function formatDate(at: Date, zone: string): string {
  return fmt(zone, { weekday: "long", day: "numeric", month: "long" }).format(at)
}

/** Minutes the zone is ahead of UTC at the given instant (DST-aware). */
export function offsetMinutes(at: Date, zone: string): number {
  const p = fmt(zone, {
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23",
  }).formatToParts(at)
  const n = (t: string) => Number(p.find((x) => x.type === t)!.value)
  const asUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"))
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000)
}

/** "UTC+3", "UTC+5:30", "UTC−8" */
export function utcLabel(at: Date, zone: string): string {
  const m = offsetMinutes(at, zone)
  const sign = m < 0 ? "−" : "+"
  const abs = Math.abs(m)
  const h = Math.floor(abs / 60)
  const mm = abs % 60
  return `UTC${sign}${h}${mm ? ":" + String(mm).padStart(2, "0") : ""}`
}

/** Offset of `zone` relative to Kyiv, e.g. "−10h", "+2:30h", "same time". */
export function diffFromKyiv(at: Date, zone: string): string {
  const d = offsetMinutes(at, zone) - offsetMinutes(at, KYIV)
  if (d === 0) return "same time"
  const sign = d < 0 ? "−" : "+"
  const abs = Math.abs(d)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${h}${m ? ":" + String(m).padStart(2, "0") : ""}h`
}

/** Calendar-day difference of `zone` vs Kyiv at the same instant: -1, 0, 1. */
export function dayDiff(at: Date, zone: string): number {
  const day = (z: string) => {
    const p = fmt(z, { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(at)
    const n = (t: string) => Number(p.find((x) => x.type === t)!.value)
    return Date.UTC(n("year"), n("month") - 1, n("day")) / 86400000
  }
  return day(zone) - day(KYIV)
}

export function dayLabel(diff: number): string {
  if (diff === 0) return "today"
  if (diff === 1) return "tomorrow"
  if (diff === -1) return "yesterday"
  return diff > 0 ? `+${diff} days` : `${diff} days`
}
