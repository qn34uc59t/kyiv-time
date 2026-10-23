import { describe, expect, it } from "vitest"
import { focus } from "./globe"

describe("globe focus", () => {
  it("aims at Kyiv: phi = -lon - 90°, theta = lat", () => {
    const f = focus(50.45, 30.52)
    expect(f.theta).toBeCloseTo(0.8805, 3)
    expect(f.phi).toBeCloseTo(-0.5327 - Math.PI / 2, 3)
  })
})
