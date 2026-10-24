// Clip 4c: install from the address bar in Chrome or Edge.
import { openTake } from "./lib.mjs"
import { desktop } from "./scenes.mjs"

export default async function record(out) {
  const t = await openTake("", { scene: desktop(), appH: 560 })
  const s = t.app
  const hint = (sel) => s.locator("body").evaluate((_, sel) => window.hint(sel), sel)
  await t.camSet(1, 240, 280)
  await t.start()
  await t.fadeIn()

  await t.say("Click the install icon in the address bar")
  await t.camTo(1.9, 330, 70, 1000)
  await hint("#inst")
  await t.sleep(600)
  await t.tap(s.locator("#inst"))
  await t.sleep(700)

  await t.say("Click Install")
  await t.camTo(1.9, 330, 110, 600)
  await hint("#confirm")
  await t.sleep(500)
  await t.tap(s.locator("#confirm"))
  await t.hideFinger()
  await t.sleep(500)

  await t.say("It opens in its own window")
  await t.camTo(1, 240, 280, 1000)
  await t.sleep(2400)

  await t.fadeOut()
  await t.finish(out)
}
