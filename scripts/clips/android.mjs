// Clip 4a: install from Chrome on Android.
import { openTake } from "./lib.mjs"
import { android } from "./scenes.mjs"

export default async function record(out) {
  const t = await openTake("", { scene: android(), appH: 760 })
  const s = t.app
  const hint = (sel) => s.locator("body").evaluate((_, sel) => window.hint(sel), sel)
  await t.camSet(1, 240, 380)
  await t.start()
  await t.fadeIn()

  await t.say("Open Chrome's menu")
  await t.camTo(1.3, 240, 150, 1000)
  await hint("#menu-btn")
  await t.sleep(500)
  await t.tap(s.locator("#menu-btn"))
  await t.sleep(700)

  await t.say("Tap Install app")
  await t.camTo(1.3, 240, 230, 700)
  await hint("#install")
  await t.sleep(400)
  await t.tap(s.locator("#install"))
  await t.sleep(700)

  await t.say("Tap Install")
  await t.camTo(1.3, 240, 330, 800)
  await hint("#confirm")
  await t.sleep(500)
  await t.tap(s.locator("#confirm"))
  await t.sleep(900)

  await t.say("Open it from your home screen")
  await t.camTo(1.3, 240, 250, 900)
  await hint("#kt")
  await t.sleep(600)
  await t.tap(s.locator("#kt"))
  await t.hideFinger()
  await t.camTo(1, 240, 380, 900)
  await t.sleep(1600)

  await t.fadeOut()
  await t.finish(out)
}
