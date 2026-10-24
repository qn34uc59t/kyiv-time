// Clip 4b: Add to Home Screen from Safari on iPhone.
import { openTake } from "./lib.mjs"
import { ios } from "./scenes.mjs"

export default async function record(out) {
  const t = await openTake("", { scene: ios(), appH: 760 })
  const s = t.app
  const hint = (sel) => s.locator("body").evaluate((_, sel) => window.hint(sel), sel)
  await t.camSet(1, 240, 600)
  await t.start()
  await t.fadeIn()

  await t.say("In Safari, tap Share")
  await t.camTo(1.3, 240, 560, 900)
  await hint("#share")
  await t.sleep(500)
  await t.tap(s.locator("#share"))
  await t.sleep(700)

  await t.say("Tap Add to Home Screen")
  await hint("#addhome")
  await t.sleep(500)
  await t.tap(s.locator("#addhome"))
  await t.sleep(800)

  await t.say("Tap Add")
  await t.camTo(1.3, 240, 150, 800)
  await hint("#add")
  await t.sleep(500)
  await t.tap(s.locator("#add"))
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
