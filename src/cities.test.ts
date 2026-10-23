import { describe, expect, it } from "vitest"
import { CITIES, EXCLUDED_COUNTRIES, MAX_EXTRA, reorder, sanitizeIds, searchCities } from "./cities"

describe("cities", () => {
  it("contains no city from an excluded country", () => {
    expect(CITIES.filter((c) => EXCLUDED_COUNTRIES.has(c.cc))).toEqual([])
  })
  it("cannot find excluded cities by search", () => {
    for (const q of ["Moscow", "Minsk", "Tehran", "Pyongyang", "Kabul", "Russia", "Belarus", "Iran"]) {
      expect(searchCities(q, []).filter((c) => EXCLUDED_COUNTRIES.has(c.cc))).toEqual([])
    }
  })
  it("finds by city and country", () => {
    expect(searchCities("lisb", [])[0].name).toBe("Lisbon")
    expect(searchCities("japan", []).length).toBeGreaterThan(0)
  })
  it("sanitizes ids: unknown, duplicate, Kyiv, junk, and cap", () => {
    const ids = sanitizeIds(["nope", "kyiv-ua", "tokyo-jp", "tokyo-jp", 5, "london-gb", "warsaw-pl", "paris-fr", "rome-it"])
    expect(ids).toEqual(["tokyo-jp", "london-gb", "warsaw-pl", "paris-fr"])
    expect(ids.length).toBe(MAX_EXTRA)
    expect(sanitizeIds("x")).toEqual([])
  })
  it("reorders without mutating, and ignores no-ops and bad indexes", () => {
    const ids = ["a", "b", "c", "d"]
    expect(reorder(ids, 0, 2)).toEqual(["b", "c", "a", "d"])
    expect(reorder(ids, 3, 0)).toEqual(["d", "a", "b", "c"])
    expect(ids).toEqual(["a", "b", "c", "d"])
    expect(reorder(ids, 1, 1)).toBe(ids)
    expect(reorder(ids, -1, 2)).toBe(ids)
    expect(reorder(ids, 1, 9)).toBe(ids)
  })
})
