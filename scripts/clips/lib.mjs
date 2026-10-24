// Records short, silent how-to clips of the real app.
// The app runs inside an iframe on a "stage" page that adds a camera (zoom/pan), a finger marker
// and a caption band, so the footage is the live UI, not a mock-up.
import { chromium } from "playwright-core"
import { spawnSync } from "node:child_process"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export const ORIGIN = process.env.CLIP_ORIGIN ?? "http://localhost:5174"
export const W = 480
export const APP_H = 560
export const BAND = 80
export const H = APP_H + BAND
const DPR = 1.5

// A fixed moment so every take shows the same clocks: 14:05 in Kyiv (winter time, UTC+2).
const NOW = new Date("2026-11-10T12:05:00Z")

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export const CAM_H = APP_H
export const stageHtml = (src, appH = APP_H) => `<!doctype html><meta charset="utf-8">
<style>
@font-face{font-family:"Inter Variable";src:url("/node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2") format("woff2");font-weight:100 900}
html,body{margin:0;background:#161412;overflow:hidden}
#stage{position:relative;width:${W}px;height:${H}px;overflow:hidden;font-family:"Inter Variable",system-ui,sans-serif}
#cam{position:absolute;inset:0 0 ${BAND}px 0;overflow:hidden;background:#161412}
#world{position:absolute;left:0;top:0;width:${W}px;height:${appH}px;transform-origin:0 0;opacity:0;filter:blur(8px)}
iframe{width:${W}px;height:${appH}px;border:0;display:block}
#finger{position:absolute;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;
  background:rgba(242,236,228,.22);border:2px solid rgba(242,236,228,.85);box-sizing:border-box;opacity:0;
  transition:transform .12s,background-color .12s,opacity .2s;pointer-events:none}
#finger.down{transform:scale(.78);background:rgba(242,236,228,.5)}
#band{position:absolute;left:0;right:0;bottom:0;height:${BAND}px;display:grid;place-items:center;
  color:#f2ece4;font-size:19px;font-weight:550;letter-spacing:-.01em;text-align:center;padding:0 24px}
#cap{opacity:0;filter:blur(8px)}
</style>
<div id="stage"><div id="cam"><div id="world"><iframe id="app" src="${src}"></iframe><div id="finger"></div></div></div>
<div id="band"><span id="cap"></span></div></div>
<script>
const EASE="cubic-bezier(0.4,0,0.2,1)"
const world=document.getElementById("world"), finger=document.getElementById("finger"), cap=document.getElementById("cap"), app=document.getElementById("app")
let cam={s:1,x:0,y:0}
const place=(s,fx,fy)=>{ // focus point (fx,fy) of the app goes to the middle of the camera, never showing past the edges
  const tx=Math.min(0,Math.max(${W}-s*${W},${W / 2}-s*fx)), ty=Math.min(0,Math.max(${CAM_H}-s*${appH},${CAM_H / 2}-s*fy))
  return {s,x:tx,y:ty}
}
const css=(c)=>"translate("+c.x+"px,"+c.y+"px) scale("+c.s+")"
world.style.transform=css(cam)
window.camTo=(s,fx,fy,ms)=>{const next=place(s,fx,fy);const a=world.animate([{transform:css(cam)},{transform:css(next)}],{duration:ms,easing:EASE,fill:"forwards"});cam=next;return a.finished.then(()=>{world.style.transform=css(next);a.cancel()})}
window.camSet=(s,fx,fy)=>{cam=place(s,fx,fy);world.style.transform=css(cam)}
window.fade=(inn)=>world.animate(inn?[{opacity:0,filter:"blur(8px)"},{opacity:1,filter:"blur(0)"}]:[{opacity:1,filter:"blur(0)"},{opacity:0,filter:"blur(8px)"}],{duration:420,easing:EASE,fill:"forwards"}).finished
window.say=async(t)=>{
  if(cap.textContent){await cap.animate([{opacity:1,filter:"blur(0)"},{opacity:0,filter:"blur(8px)"}],{duration:200,easing:EASE,fill:"forwards"}).finished}
  cap.textContent=t
  if(t) await cap.animate([{opacity:0,filter:"blur(8px)"},{opacity:1,filter:"blur(0)"}],{duration:380,easing:EASE,fill:"forwards"}).finished
}
function wire(){
  const w=app.contentWindow
  w.addEventListener("mousemove",e=>{finger.style.opacity=1;finger.style.transform="translate("+e.clientX+"px,"+e.clientY+"px)"+(finger.classList.contains("down")?" scale(.78)":"")},true)
  w.addEventListener("mousedown",()=>finger.classList.add("down"),true)
  w.addEventListener("mouseup",()=>finger.classList.remove("down"),true)
}
app.addEventListener("load",wire)
</script>`

/** Opens the stage with the app at `query` (e.g. "?c=tokyo-jp&h=12&g=0"). Returns helpers for scripting a take. */
export async function openTake(query, { scene, appH } = {}) {
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--hide-scrollbars"],
  })
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: DPR,
    colorScheme: "dark",
    reducedMotion: "no-preference",
    serviceWorkers: "block",
  })
  // The walkthrough would open over the app on a first visit.
  await context.addInitScript(() => localStorage.setItem("kyiv-time:tour", "1"))
  const page = await context.newPage()
  await page.clock.install({ time: NOW })
  await page.route(`${ORIGIN}/__stage`, (r) => r.fulfill({ contentType: "text/html", body: stageHtml(scene ? "/__scene" : `/${query}`, appH) }))
  if (scene) await page.route(`${ORIGIN}/__scene`, (r) => r.fulfill({ contentType: "text/html", body: scene }))
  await page.goto(`${ORIGIN}/__stage`)
  const app = page.frameLocator("#app")
  await app.locator(scene ? "body" : "#rows").waitFor({ state: "attached" })
  if (scene) await app.locator("iframe").first().waitFor({ state: "attached" })
  await page.clock.resume()
  await page.evaluate(() => document.fonts.ready)
  await sleep(400)
  return new Take(browser, context, page, app)
}

class Take {
  constructor(browser, context, page, app) {
    Object.assign(this, { browser, context, page, app, frames: [], mx: W / 2, my: APP_H })
  }
  sleep = sleep

  async start() {
    this.cdp = await this.context.newCDPSession(this.page)
    this.cdp.on("Page.screencastFrame", async (f) => {
      this.frames.push({ t: f.metadata.timestamp, data: Buffer.from(f.data, "base64") })
      await this.cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {})
    })
    await this.cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1 })
    await sleep(150)
  }

  hideFinger = () => this.page.evaluate(() => (document.getElementById("finger").style.opacity = 0))
  fadeIn = () => this.page.evaluate(() => window.fade(true))
  fadeOut = () => this.page.evaluate(() => window.fade(false))
  say = (t) => this.page.evaluate((t) => window.say(t), t)
  camTo = (s, x, y, ms = 900) => this.page.evaluate(([s, x, y, ms]) => window.camTo(s, x, y, ms), [s, x, y, ms])
  camSet = (s, x, y) => this.page.evaluate(([s, x, y]) => window.camSet(s, x, y), [s, x, y])

  /** Centre of an element in page (mouse) coordinates. */
  async center(locator) {
    const b = await locator.boundingBox()
    if (!b) throw new Error("element not visible")
    return [b.x + b.width / 2, b.y + b.height / 2]
  }

  /** Glides the pointer in a smooth ease, like a finger. */
  async glide(x, y, ms = 600) {
    const [x0, y0] = [this.mx, this.my]
    const n = Math.max(2, Math.round(ms / 16))
    for (let i = 1; i <= n; i++) {
      const k = ease(i / n)
      await this.page.mouse.move(x0 + (x - x0) * k, y0 + (y - y0) * k)
      await sleep(ms / n)
    }
    ;[this.mx, this.my] = [x, y]
  }

  async tap(locator, ms = 550) {
    const [x, y] = await this.center(locator)
    await this.glide(x, y, ms)
    await sleep(120)
    await this.page.mouse.down()
    await sleep(110)
    await this.page.mouse.up()
    await sleep(160)
  }

  /** Press at the locator's centre, then drag by (dx, dy), then release. */
  async drag(locator, dx, dy, ms = 1200, grabMs = 500) {
    const [x, y] = await this.center(locator)
    await this.glide(x, y, grabMs)
    await sleep(120)
    await this.page.mouse.down()
    await sleep(140)
    await this.glide(x + dx, y + dy, ms)
    await sleep(160)
    await this.page.mouse.up()
    await sleep(200)
  }

  async type(text, delay = 150) {
    await this.page.keyboard.type(text, { delay })
  }

  /** Stops recording and writes <outFile>.mp4. */
  async finish(outFile, { trim = 0.15, posterAt = 0.55 } = {}) {
    await sleep(120)
    await this.cdp.send("Page.stopScreencast")
    const dir = join(process.env.CLIP_TMP ?? "/tmp", `clip-${Date.now()}`)
    mkdirSync(dir, { recursive: true })
    const frames = this.frames
    if (frames.length < 2) throw new Error("no frames captured")
    const lines = []
    frames.forEach((f, i) => {
      const name = `f${String(i).padStart(5, "0")}.jpg`
      writeFileSync(join(dir, name), f.data)
      const dur = i < frames.length - 1 ? frames[i + 1].t - f.t : 0.04
      lines.push(`file '${name}'`, `duration ${Math.max(0.001, dur).toFixed(4)}`)
    })
    lines.push(`file 'f${String(frames.length - 1).padStart(5, "0")}.jpg'`)
    writeFileSync(join(dir, "list.txt"), lines.join("\n"))
    mkdirSync(join(outFile, ".."), { recursive: true })
    const r = spawnSync(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(dir, "list.txt"), "-ss", String(trim),
       "-vf", "fps=30,scale=720:960:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "27",
       "-movflags", "+faststart", "-an", outFile],
      { stdio: "inherit" },
    )
    // A still for the sheet to show while the clip loads, offline, or when motion is reduced.
    const dur = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", outFile]).stdout)
    spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String((dur * posterAt).toFixed(2)), "-i", outFile, "-frames:v", "1", "-q:v", "4", outFile.replace(/\.mp4$/, ".jpg")], { stdio: "inherit" })
    rmSync(dir, { recursive: true, force: true })
    await this.browser.close()
    if (r.status !== 0) throw new Error("ffmpeg failed")
  }
}
