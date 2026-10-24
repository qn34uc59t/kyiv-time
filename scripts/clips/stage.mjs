// Records the install clips frame by frame at a steady 60 fps.
// A mock screen (scenes in install-scenes.mjs, with the real app inside) sits on a "stage" page that adds
// a camera, a finger (or mouse pointer), a coral ring and a caption band. Nothing on the stage animates
// by itself: a clip script lays out every move on one timeline up front, and the recorder seeks that
// timeline to each frame's time and takes a screenshot. Frame rate never depends on how fast the
// machine renders, and the last frame flows into the first, so the clip loops without a seam.
import { chromium } from "playwright-core"
import { spawn, spawnSync } from "node:child_process"

export const ORIGIN = process.env.CLIP_ORIGIN ?? "http://localhost:5174"
const W = 480
const CAM_H = 560
const BAND = 80
const H = CAM_H + BAND
const DPR = 2 // rendered at 960x1280, scaled down to 720x960 for crisp text
const FPS = 60

// A fixed moment so every take shows the same clocks: 14:05 in Kyiv (winter time, UTC+2).
const NOW = new Date("2026-11-10T12:05:00Z")

const stageHtml = (appH, pointer) => `<!doctype html><meta charset="utf-8">
<style>
@font-face{font-family:"Inter Variable";src:url("/node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2") format("woff2");font-weight:100 900}
:root{--bg:#ece7e0;--ink:#1d1a17;--coral:#ee6a58}
html,body{margin:0;background:var(--bg);overflow:hidden}
#stage{position:relative;width:${W}px;height:${H}px;overflow:hidden;font-family:"Inter Variable",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
#cam{position:absolute;inset:0 0 ${BAND}px 0;overflow:hidden}
#world{position:absolute;left:0;top:0;width:${W}px;height:${appH}px;transform-origin:0 0}
#world>*{position:absolute;left:0;top:0}
#scene{width:${W}px;height:${appH}px;border:0;display:block}
#ring{border:2.5px solid var(--coral);box-sizing:border-box;transform-origin:50% 50%}
#ripple{width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;border:3px solid var(--coral);box-sizing:border-box}
#finger{width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(29,26,23,.16);border:2px solid rgba(29,26,23,.62);box-sizing:border-box}
#pointer{width:22px;height:30px;transform-origin:0 0}
#band{position:absolute;left:0;right:0;bottom:0;height:${BAND}px}
#band span{position:absolute;inset:0 24px;display:flex;align-items:center;justify-content:center;gap:10px;
  color:var(--ink);font-size:19px;font-weight:580;letter-spacing:-.012em;text-align:center}
#band b{color:var(--coral);font-weight:650;font-variant-numeric:tabular-nums}
</style>
<div id="stage"><div id="cam"><div id="world">
  <iframe id="scene" src="/__scene"></iframe>
  <div id="ring"></div><div id="ripple"></div>
  ${pointer === "mouse"
    ? `<svg id="pointer" viewBox="0 0 22 30"><path d="M1.5 1.5v23.2l6.1-5.6 3.9 9.1 4.2-1.8-3.9-8.9h8.4z" fill="#fdfbf8" stroke="#1d1a17" stroke-width="1.8" stroke-linejoin="round"/></svg>`
    : `<div id="finger"></div>`}
</div></div><div id="band"></div></div>
<script>
// Easing curves, as cubic-bezier(x1,y1,x2,y2).
const bez=(x1,y1,x2,y2)=>{
  const f=(a,b,t)=>3*a*t*(1-t)**2+3*b*t*t*(1-t)+t**3, d=(a,b,t)=>3*a*(1-t)**2+6*(b-a)*t*(1-t)+3*(1-b)*t*t
  return x=>{if(x<=0)return 0;if(x>=1)return 1;let t=x;for(let i=0;i<8;i++){const dx=f(x1,x2,t)-x;if(Math.abs(dx)<1e-6)break;const s=d(x1,x2,t);if(Math.abs(s)<1e-6)break;t-=dx/s}
    let lo=0,hi=1;if(Math.abs(f(x1,x2,t)-x)>1e-4){t=x;for(let i=0;i<30;i++){f(x1,x2,t)<x?lo=t:hi=t;t=(lo+hi)/2}}return f(y1,y2,t)}
}
const EASES={
  std:bez(.4,0,.2,1),        // the app's own ease
  inOut:bez(.65,0,.35,1),    // camera and pointer travel
  out:bez(.16,1,.3,1),       // things arriving
  in:bez(.55,0,.75,.2),      // things leaving
  pop:bez(.3,1.45,.55,1),    // a small overshoot for icons appearing
}
const DEFAULTS={o:1,b:0,x:0,y:0,s:1}

// One track per element: per property, a list of tweens sorted by start time.
const tracks=new Map()
const track=el=>{let t=tracks.get(el);if(!t){t={};tracks.set(el,t)}return t}
const valueAt=(segs,t,prop)=>{let v=DEFAULTS[prop];for(const g of segs){if(t<g.t0)break;v=t>=g.t1?g.to:g.from+(g.to-g.from)*g.ease((t-g.t0)/(g.t1-g.t0))}return v}
const add=(el,prop,t0,dur,to,ease)=>{
  const segs=(track(el)[prop]??=[])
  const g={t0,t1:t0+Math.max(dur,0),from:valueAt(segs,t0,prop),to,ease:EASES[ease]??ease}
  if(g.t1===g.t0)g.from=to
  let i=segs.length;while(i>0&&segs[i-1].t0>t0)i--;segs.splice(i,0,g)
}
const write=(el,p)=>{
  const s=el.style
  if("o" in p){s.opacity=p.o;s.visibility=p.o<.003?"hidden":""}
  if("b" in p)s.filter=p.b>.05?"blur("+p.b.toFixed(2)+"px)":""
  if("x" in p||"y" in p||"s" in p)s.transform="translate("+(p.x??0)+"px,"+(p.y??0)+"px) scale("+(p.s??1)+")"
  if("w" in p)s.width=p.w+"px"
  if("h" in p)s.height=p.h+"px"
}
window.seek=t=>{for(const[el,tr]of tracks){const p={};for(const k in tr)p[k]=valueAt(tr[k],t,k);write(el,p)}}

const $=s=>document.querySelector(s)
const world=$("#world"), ring=$("#ring"), ripple=$("#ripple"), finger=$("#finger")??$("#pointer"), band=$("#band")
const sceneDoc=()=>$("#scene").contentDocument
const el=s=>typeof s==="string"?(sceneDoc().querySelector(s)??(()=>{throw new Error("no "+s)})()):s

// The timeline builder a clip script drives. Everything starts at the cursor B.t; only wait() and tap() move it.
const B=window.B={
  t:0,
  wait(ms){B.t+=ms},
  /** Starting values, before anything moves. */
  init(s,props){const e=el(s);for(const k in props)add(e,k,-1e9,0,props[k],"std")},
  hidden(...sels){for(const s of sels)B.init(s,{o:0,b:8})},
  set(s,props){const e=el(s);for(const k in props)add(e,k,B.t,0,props[k],"std")},
  to(s,props,dur=420,ease="std",delay=0){const e=el(s);for(const k in props)add(e,k,B.t+delay,dur,props[k],ease)},
  show(s,from={},dur=420,ease="out",delay=0){B.set(s,{b:8,...from});B.to(s,{o:1,b:0,...Object.fromEntries(Object.keys(from).map(k=>[k,DEFAULTS[k]]))},dur,ease,delay);B.to(s,{o:1},Math.min(dur,260),"std",delay)},
  hide(s,to={},dur=280,ease="in",delay=0){B.to(s,{o:0,b:8,...to},dur,ease,delay)},
  /** The element's box in scene coordinates, as it looks at the cursor. */
  box(s){seek(B.t);return el(s).getBoundingClientRect()},
  /** Camera: scale s, with scene point (fx, fy) brought to the middle of the frame (but never past the scene's edges). */
  cam(s,fx,fy,dur=1000,ease="inOut"){
    const sh=world.offsetHeight
    const fit=(view,size,f)=>s*size<=view?(view-s*size)/2:Math.min(0,Math.max(view-s*size,view/2-s*f))
    const p={s,x:fit(${W},${W},fx),y:fit(${CAM_H},sh,fy)}
    dur?B.to(world,p,dur,ease):B.set(world,p)
  },
  /** Coral ring around an element: glides there if it's already showing, else resolves in place. */
  ring(s,{pad=5,dur=480}={}){
    const r=B.box(s), p={x:r.left-pad,y:r.top-pad,w:r.width+2*pad,h:r.height+2*pad}
    const zoom=r.width/(el(s).offsetWidth||r.width) // the desktop scene is drawn at half size
    ring.style.borderRadius=(parseFloat(getComputedStyle(el(s)).borderRadius)||10)*zoom+pad+"px"
    if(valueAt(track(ring).o??[],B.t,"o")<.5){B.set(ring,{...p,s:1.18,b:6});B.to(ring,{o:1,s:1,b:0},dur,"out")}
    else B.to(ring,p,dur,"inOut")
  },
  unring(dur=260){B.to(ring,{o:0,s:.94,b:4},dur,"in")},
  /** The pointer travels to the element's centre and presses it. Moves the cursor to just after the press. */
  tap(s,{glide=720,from}={}){
    const r=B.box(s), x=r.left+r.width/2, y=r.top+r.height/2
    if(valueAt(track(finger).o??[],B.t,"o")<.5){
      const [sx,sy]=from??[x+70,y+150]
      B.set(finger,{x:sx,y:sy,s:1.15,o:0,b:4});B.to(finger,{o:1,s:1,b:0},320,"out")
    }
    B.to(finger,{x},glide,"inOut");B.to(finger,{y},glide,bez(.45,0,.3,1))
    B.wait(glide+90)
    B.to(finger,{s:.8},110,"std");B.to(finger,{s:1},260,"out",110)
    B.set(ripple,{x,y,s:.35,o:.6,b:0});B.to(ripple,{s:1.7,o:0},620,"out")
    B.wait(130)
  },
  lift(dur=300){B.to(finger,{o:0,s:1.12,b:4},dur,"in")},
  say(text,step){
    const prev=band.lastElementChild
    const span=document.createElement("span");span.innerHTML=(step?"<b>"+step+"</b>":"")+text;band.append(span)
    if(!prev){B.init(span,{o:1,b:0,y:0});return}
    B.hide(prev,{y:-8},260)
    B.init(span,{o:0,b:8,y:10});B.to(span,{o:1,b:0,y:0},460,"out",140)
  },
  /** Brings everything back to how it is at time 0, so the clip loops without a seam. Returns the length. */
  loop(dur=1000){
    // Settle a few frames early: an ease's last sliver would otherwise land as a tiny jump on frame 0.
    const t0=B.t, end=t0+dur, settle=120
    dur-=settle
    for(const[e,tr]of tracks){
      const first=k=>tr[k]?valueAt(tr[k],0,k):DEFAULTS[k]
      const fades=e!==world&&first("o")===0
      for(const k in tr){
        const v=first(k)
        if(Math.abs(valueAt(tr[k],t0,k)-v)<1e-6)continue
        // Something that wasn't on screen at the start just resolves away; its position snaps back unseen.
        if(fades&&k!=="o"&&k!=="b")add(e,k,t0+dur,0,v,"std")
        else add(e,k,t0,dur,v,k==="o"||k==="b"?"std":"inOut")
      }
    }
    B.t=end
    return end
  },
}
B.init(ring,{o:0,x:0,y:0,w:40,h:40});B.init(ripple,{o:0});B.init(finger,{o:0,x:${W / 2},y:${CAM_H}})
</script>`

/**
 * Records one clip. `clip` = { scene: html, appH, pointer: "finger"|"mouse", build(B), posterAt }.
 * `build` runs inside the stage page with the timeline builder `B` and returns the clip length in ms.
 */
export async function record(out, clip) {
  const browser = await chromium.launch({ channel: "chrome", args: ["--hide-scrollbars", "--force-color-profile=srgb"] })
  try {
    const context = await browser.newContext({
      viewport: { width: W, height: H },
      deviceScaleFactor: DPR,
      colorScheme: "light",
      reducedMotion: "no-preference",
      serviceWorkers: "block",
    })
    // The welcome screen would open over the app on a first visit.
    await context.addInitScript(() => localStorage.setItem("kyiv-time:tour", "1"))
    const page = await context.newPage()
    await page.clock.setFixedTime(NOW)
    await page.route(`${ORIGIN}/__stage`, (r) => r.fulfill({ contentType: "text/html", body: stageHtml(clip.appH, clip.pointer) }))
    await page.route(`${ORIGIN}/__scene`, (r) => r.fulfill({ contentType: "text/html", body: clip.scene }))
    await page.goto(`${ORIGIN}/__stage`)
    // Wait for every copy of the real app in the scene to render and settle.
    const scene = page.frameLocator("#scene")
    await scene.locator("body").waitFor({ state: "attached" })
    const apps = scene.locator("iframe")
    for (let i = 0; i < (await apps.count()); i++) await apps.nth(i).contentFrame().locator("#rows > *").first().waitFor({ state: "attached" })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(1500)

    const total = await page.evaluate(`(${clip.build.toString()})(window.B)`)
    const frames = Math.round((total / 1000) * FPS)
    console.log(`  ${(total / 1000).toFixed(2)}s, ${frames} frames`)

    const ff = spawn(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
       "-vf", "scale=720:960:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "24",
       "-tune", "animation", "-g", String(FPS * 2), "-r", String(FPS), "-movflags", "+faststart", "-an", out],
      { stdio: ["pipe", "inherit", "inherit"] },
    )
    const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg failed")))))
    const cdp = await context.newCDPSession(page)
    // Frame `frames` would equal frame 0, so stop one short of it.
    for (let i = 0; i < frames; i++) {
      await page.evaluate((t) => window.seek(t), (i * 1000) / FPS)
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png" })
      if (!ff.stdin.write(Buffer.from(data, "base64"))) await new Promise((r) => ff.stdin.once("drain", r))
      if (i % 120 === 0) process.stdout.write(`  frame ${i}/${frames}\r`)
    }
    ff.stdin.end()
    await done

    // A still for the sheet to show while the clip loads, offline, or when motion is reduced.
    const at = ((total / 1000) * (clip.posterAt ?? 0.5)).toFixed(3)
    spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", at, "-i", out, "-frames:v", "1", "-q:v", "3", out.replace(/\.mp4$/, ".jpg")], { stdio: "inherit" })
  } finally {
    await browser.close()
  }
}
