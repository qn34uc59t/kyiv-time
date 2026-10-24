// Clip 4d: pin the tab so it stays put (any desktop browser).
import { openTake } from "./lib.mjs"
import { pin } from "./scenes.mjs"

export default async function record(out) {
  const t = await openTake("", { scene: pin(), appH: 560 })
  const s = t.app
  const hint = (sel) => s.locator("body").evaluate((_, sel) => window.hint(sel), sel)
  await t.camSet(1, 240, 280)
  await t.start()
  await t.fadeIn()

  await t.say("Right-click the tab")
  await t.camTo(1.9, 150, 60, 1000)
  await t.sleep(400)
  const [x, y] = await t.center(s.locator("#t1"))
  await t.glide(x, y, 700)
  await t.sleep(300)
  await t.page.mouse.click(x, y, { button: "right" })
  await t.sleep(800)

  await t.say("Choose Pin")
  await hint("#pin")
  await t.sleep(500)
  await t.tap(s.locator("#pin"))
  await t.hideFinger()
  await t.sleep(600)

  await t.say("It stays put, and reopens with your browser")
  await t.sleep(2600)
  await t.camTo(1, 240, 280, 800)
  await t.sleep(600)

  await t.fadeOut()
  await t.finish(out)
}
