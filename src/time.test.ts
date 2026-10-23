import { describe, expect, it } from "vitest"
import { KYIV, dayDiff, diffFromKyiv, formatTime, offsetMinutes, utcLabel } from "./time"

const d = (s: string) => new Date(s)

describe("time", () => {
  it("Kyiv is UTC+3 in summer, UTC+2 in winter", () => {
    expect(offsetMinutes(d("2026-07-01T12:00:00Z"), KYIV)).toBe(180)
    expect(offsetMinutes(d("2026-01-15T12:00:00Z"), KYIV)).toBe(120)
  })
  it("handles half-hour zones", () => {
    expect(utcLabel(d("2026-07-01T12:00:00Z"), "Asia/Kolkata")).toBe("UTC+5:30")
    expect(utcLabel(d("2026-07-01T12:00:00Z"), "Asia/Kathmandu")).toBe("UTC+5:45")
  })
  it("diff is DST-aware: LA vs Kyiv is -10h in summer and -10h/-11h around US/EU DST gaps", () => {
    expect(diffFromKyiv(d("2026-07-01T12:00:00Z"), "America/Los_Angeles")).toBe("−10h")
    // US already in DST (Mar 9 2026), EU not yet (Mar 29)
    expect(diffFromKyiv(d("2026-03-15T12:00:00Z"), "America/Los_Angeles")).toBe("−9h")
  })
  it("formats 24h time", () => {
    expect(formatTime(d("2026-07-01T21:05:00Z"), KYIV)).toBe("00:05")
  })
  it("day diff", () => {
    expect(dayDiff(d("2026-07-01T21:30:00Z"), KYIV)).toBe(0)
    expect(dayDiff(d("2026-07-01T21:30:00Z"), "Asia/Tokyo")).toBe(0)
    expect(dayDiff(d("2026-07-01T10:00:00Z"), "Pacific/Auckland")).toBe(0)
    expect(dayDiff(d("2026-07-01T20:00:00Z"), "Asia/Tokyo")).toBe(1)
    expect(dayDiff(d("2026-07-01T01:00:00Z"), "America/Los_Angeles")).toBe(-1)
  })
})
