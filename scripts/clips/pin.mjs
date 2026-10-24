// Pin the tab so it stays put (any desktop browser).
import { record } from "./stage.mjs"
import { pin } from "./install-scenes.mjs"

function build(B) {
  const mid = (r) => [r.left + r.width / 2, r.top + r.height / 2]
  B.hidden("#menu", "#dock-icon")
  B.init("#dock-kt", { w: 0 })
  B.init("#t1", { w: 230 })
  B.cam(1, 240, 280, 0)
  B.say("Right-click the tab", 1)

  B.wait(450)
  const [tx, ty] = mid(B.box("#t1"))
  B.cam(2.3, tx + 50, ty + 60, 1300)
  B.wait(700)
  B.ring("#t1", { pad: 3 })
  B.tap("#t1", { glide: 850, from: [tx + 80, ty + 120] })
  B.unring()
  B.show("#menu", { s: 0.9 }, 460)

  B.wait(600)
  B.say("Choose Pin", 2)
  B.wait(200)
  B.ring("#pin")
  B.wait(250)
  B.tap("#pin", { glide: 600 })
  B.unring()
  B.lift()
  B.hide("#menu", { s: 0.96 }, 240)
  B.wait(200)

  // The tab shrinks to just its icon and moves nowhere.
  B.hide("#t1 span", {}, 220)
  B.hide("#t1 .x", {}, 220)
  B.to("#t1", { w: 48 }, 560, "inOut")
  B.wait(500)
  B.say("It stays put, and reopens with your browser", 3)
  B.cam(1.6, tx, ty + 120, 1100)
  B.wait(1900)
  B.cam(1, 240, 280, 1200)
  B.wait(1500)
  return B.loop(1100)
}

export default (out) => record(out, { scene: pin(), appH: 560, pointer: "mouse", build, posterAt: 0.45 })
