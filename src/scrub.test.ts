import { afterEach, describe, expect, it } from "vitest"
import { AUTO_LIVE_MS, getInstant, msUntilLive, isLive, offsetLabel, reset, setOffset } from "./scrub"

const NOW = Date.parse("2026-10-23T13:07:30Z")

afterEach(reset)

describe("scrub", () => {
  it("is live at zero and follows the clock", () => {
    expect(isLive()).toBe(true)
    expect(getInstant(NOW).getTime()).toBe(NOW)
  })
  it("shifts from a 15-minute anchor and stays put as time passes", () => {
    setOffset(180, NOW)
    const first = getInstant(NOW).getTime()
    expect(first).toBe(Date.parse("2026-10-23T16:00:00Z"))
    expect(getInstant(NOW + 600000).getTime()).toBe(first)
  })
  it("keeps the anchor while scrubbing further", () => {
    setOffset(60, NOW)
    setOffset(120, NOW + 3_600_000)
    expect(getInstant().getTime()).toBe(Date.parse("2026-10-23T15:00:00Z"))
  })
  it("snaps to steps and clamps to the range", () => {
    setOffset(7, NOW)
    expect(isLive()).toBe(true)
    setOffset(99999, NOW)
    expect(getInstant().getTime() - Date.parse("2026-10-23T13:00:00Z")).toBe(24 * 3600000)
  })
  it("counts down to live from the last touch", () => {
    expect(msUntilLive(NOW)).toBe(Infinity)
    setOffset(60, NOW)
    expect(msUntilLive(NOW + 10 * 60000)).toBe(AUTO_LIVE_MS - 10 * 60000)
    setOffset(120, NOW + 20 * 60000)
    expect(msUntilLive(NOW + 30 * 60000)).toBe(AUTO_LIVE_MS - 10 * 60000)
    expect(msUntilLive(NOW + 60 * 60000)).toBe(0)
    reset()
    expect(msUntilLive(NOW + 60 * 60000)).toBe(Infinity)
  })
  it("labels", () => {
    expect(offsetLabel(0)).toBe("Live")
    expect(offsetLabel(195)).toBe("+3h 15m from now")
    expect(offsetLabel(-45)).toBe("−45m from now")
    expect(offsetLabel(-120)).toBe("−2h from now")
  })
})
