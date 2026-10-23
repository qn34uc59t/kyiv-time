/** Scrubbing shifts the reference instant by whole steps from a fixed anchor, so a scrubbed time never drifts. */
export const STEP_MIN = 15
export const RANGE_MIN = 24 * 60

let anchor = 0
let offset = 0
let touchedAt = 0

export const floorToStep = (ms: number) => Math.floor(ms / (STEP_MIN * 60000)) * STEP_MIN * 60000

export function setOffset(minutes: number, now = Date.now()) {
  if (offset === 0 && minutes !== 0) anchor = floorToStep(now)
  touchedAt = now
  offset = Math.max(-RANGE_MIN, Math.min(RANGE_MIN, Math.round(minutes / STEP_MIN) * STEP_MIN))
}

/** A planned time is dropped back to live after this long without being touched. */
export const AUTO_LIVE_MS = 30 * 60000

/** Milliseconds left before a planned time returns to live; Infinity while live. */
export const msUntilLive = (now = Date.now()) =>
  offset === 0 ? Infinity : Math.max(0, touchedAt + AUTO_LIVE_MS - now)

export const getOffset = () => offset
export const isLive = () => offset === 0
export const reset = () => setOffset(0)

export function getInstant(now = Date.now()): Date {
  return new Date(offset === 0 ? now : anchor + offset * 60000)
}

/** "+3h 15m from now", "−45m from now" */
export function offsetLabel(minutes: number): string {
  if (minutes === 0) return "Live"
  const sign = minutes < 0 ? "−" : "+"
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${h ? h + "h" : ""}${h && m ? " " : ""}${m ? m + "m" : ""} from now`
}
