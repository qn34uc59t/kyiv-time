// Install from the address bar in Chrome or Edge.
import { record } from "./stage.mjs"
import { desktop } from "./install-scenes.mjs"

function build(B) {
  const ZOOM = 0.5 // the scene is drawn at 960 wide and shown at half size
  const mid = (r) => [r.left + r.width / 2, r.top + r.height / 2]
  B.hidden("#pop", "#appwin", "#dock-icon")
  B.init("#dock-kt", { w: 0 })
  B.cam(1, 240, 280, 0)
  B.say("Click the install icon in the address bar", 1)

  B.wait(450)
  const [ix, iy] = mid(B.box("#inst"))
  B.cam(2.3, ix - 30, iy + 40, 1300)
  B.wait(700)
  B.ring("#inst", { pad: 3 })
  B.tap("#inst", { glide: 850, from: [ix - 90, iy + 110] })
  B.unring()
  B.show("#pop", { s: 0.9 }, 480)

  B.wait(250)
  const [px, py] = mid(B.box("#pop"))
  B.cam(1.9, px, py, 950)
  B.wait(700)
  B.say("Click Install", 2)
  B.wait(200)
  B.ring("#confirm")
  B.wait(250)
  B.tap("#confirm", { glide: 650 })
  B.unring()
  B.lift()
  B.hide("#pop", { s: 0.96 }, 240)
  B.wait(180)

  // The browser steps back and the app comes up in its own window, out of the install icon.
  B.cam(1, 240, 280, 1300)
  B.hide("#browser", { s: 0.97 }, 520)
  const A = B.box("#appwin"), I = B.box("#inst")
  B.set("#appwin", { x: (I.left - A.left) / ZOOM, y: (I.top - A.top) / ZOOM, s: I.width / A.width })
  B.to("#appwin", { x: 0, y: 0, s: 1 }, 800, "out", 120)
  B.to("#appwin", { o: 1, b: 0 }, 300, "std", 120)
  B.wait(450)
  B.say("It opens in its own window", 3)
  B.to("#dock-kt", { w: 72 }, 480, "inOut", 250)
  B.show("#dock-icon", { s: 0.4 }, 650, "pop", 450)
  B.wait(2900)
  return B.loop(1100)
}

export default (out) => record(out, { scene: desktop(), appH: 560, pointer: "mouse", build, posterAt: 0.35 })
