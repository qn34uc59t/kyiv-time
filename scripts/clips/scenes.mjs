// Small interactive mock-ups of the install flows. Browser and OS chrome can't be screen-recorded
// from a page, so these draw a generic version of each step; the app inside is the real one.
// Monochrome on purpose: only coral marks what to tap.

export const SITE = "qn34uc59t.github.io"
const APP = "/?c=tokyo-jp,new-york-city-us&h=12&g=0"

const base = (body, script, extraCss = "") => `<!doctype html><meta charset="utf-8">
<style>
@font-face{font-family:"Inter Variable";src:url("/node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2") format("woff2");font-weight:100 900}
:root{--paper:#161412;--ink:#f2ece4;--soft:#9a9086;--coral:#f27d6c;--s1:#1f1c19;--s2:#2b2724;--s3:#3a352f}
*{box-sizing:border-box;margin:0}
html,body{background:var(--paper);color:var(--ink);font-family:"Inter Variable",system-ui,sans-serif;overflow:hidden;-webkit-font-smoothing:antialiased}
[hidden]{display:none!important}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:default}
svg{display:block;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
iframe{border:0;display:block;pointer-events:none}
.hint{outline:2px solid var(--coral);outline-offset:3px}
.phone{position:absolute;left:70px;top:10px;width:340px;height:740px;border-radius:38px;background:#0d0b0a;border:6px solid var(--s2);overflow:hidden}
.screen{position:absolute;inset:0;background:var(--s1);overflow:hidden}
.layer{position:absolute;inset:0}
.status{position:absolute;left:0;right:0;top:0;height:28px;padding:6px 20px 0;display:flex;justify-content:space-between;font-size:12px;font-weight:600;z-index:9;pointer-events:none}
.grid{position:absolute;left:8px;right:8px;top:64px;display:grid;grid-template-columns:repeat(4,1fr);row-gap:22px}
.app{display:grid;justify-items:center;gap:6px;font-size:11px;color:var(--ink)}
.app i{width:54px;height:54px;border-radius:15px;background:var(--s3)}
.app img{width:54px;height:54px;border-radius:15px;display:block}
.scrim{position:absolute;inset:0;background:rgba(0,0,0,.55)}
.sheet{position:absolute;background:var(--s2);color:var(--ink)}
.row{display:flex;align-items:center;gap:14px;height:46px;padding:0 16px;font-size:14px;white-space:nowrap}
.row svg{width:20px;height:20px;color:var(--soft);flex:none}
.btns{display:flex;justify-content:flex-end;gap:8px}
.btns button{height:40px;padding:0 18px;border-radius:20px;font-size:14px;font-weight:600}
.btns .go{background:var(--coral);color:#1d1a17}
.btns .no{color:var(--coral)}
${extraCss}
</style>
${body}
<script>
const EASE="cubic-bezier(0.4,0,0.2,1)"
const $=s=>document.querySelector(s)
const show=(el,ms=380)=>{el.hidden=false;return el.animate([{opacity:0,filter:"blur(8px)"},{opacity:1,filter:"blur(0)"}],{duration:ms,easing:EASE}).finished}
const hide=(el,ms=260)=>el.animate([{opacity:1,filter:"blur(0)"},{opacity:0,filter:"blur(8px)"}],{duration:ms,easing:EASE}).finished.then(()=>{el.hidden=true})
const wait=ms=>new Promise(r=>setTimeout(r,ms))
window.hint=s=>$(s).classList.add("hint")
window.unhint=s=>$(s).classList.remove("hint")
${script}
</script>`

const dots = `<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/></svg>`
const lock = `<svg width="13" height="13" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>`
const home = (labels) =>
  labels.map((l) => `<div class="app"><i></i><span>${l}</span></div>`).join("") +
  `<div class="app" id="kt" style="visibility:hidden"><img src="/icons/icon-192.png" alt=""><span>Kyiv Time</span></div>`

export const android = () =>
  base(
    `<div class="phone"><div class="screen">
  <div class="status"><span>14:05</span><span>5G ▮</span></div>
  <section class="layer" id="chrome">
    <div style="position:absolute;top:28px;left:0;right:0;height:52px;display:flex;align-items:center;gap:4px;padding:0 6px 0 12px;background:var(--s1)">
      <div style="flex:1;height:38px;border-radius:19px;background:var(--s2);display:flex;align-items:center;gap:8px;padding:0 14px;font-size:13px">${lock}<span>${SITE}</span></div>
      <button style="width:34px;height:34px;display:grid;place-items:center;border:1.8px solid var(--soft);border-radius:8px;font-size:12px;font-weight:600;margin:0 4px">1</button>
      <button id="menu-btn" style="width:40px;height:44px;display:grid;place-items:center;border-radius:12px">${dots}</button>
    </div>
    <iframe style="position:absolute;top:80px;left:0" width="328" height="626" src="${APP}"></iframe>
  </section>
  <div class="scrim" id="scrim" hidden></div>
  <nav class="sheet" id="menu" hidden style="top:74px;right:8px;width:216px;border-radius:16px;padding:6px 0">
    <div class="row">New tab</div><div class="row">History</div><div class="row">Downloads</div>
    <div class="row" id="install"><svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M12 8v6m-3-2.5l3 3 3-3"/></svg>Install app</div>
    <div class="row">Share…</div><div class="row">Find in page</div><div class="row">Settings</div>
  </nav>
  <div class="sheet" id="dialog" hidden style="left:20px;right:20px;top:250px;border-radius:26px;padding:24px 22px 18px">
    <div style="display:flex;align-items:center;gap:14px"><img src="/icons/icon-192.png" width="52" height="52" style="border-radius:13px" alt="">
      <div><div style="font-weight:600;font-size:17px">Install app?</div><div style="font-size:13px;color:var(--soft);margin-top:2px">Kyiv Time · ${SITE}</div></div></div>
    <div class="btns" style="margin-top:26px"><button class="no">Cancel</button><button class="go" id="confirm">Install</button></div>
  </div>
  <section class="layer" id="home" hidden style="background:var(--paper)"><div class="grid">${home(["Phone", "Messages", "Camera", "Photos", "Maps", "Mail", "Notes"])}</div></section>
  <div class="sheet" id="toast" hidden style="left:50%;translate:-50% 0;bottom:50px;border-radius:22px;padding:11px 18px;font-size:13px;white-space:nowrap">Kyiv Time added to Home screen</div>
  <section class="layer" id="standalone" hidden><iframe style="position:absolute;top:28px;left:0" width="328" height="676" src="${APP}"></iframe></section>
</div></div>`,
    `
$("#menu-btn").onclick=async()=>{show($("#scrim"),300);show($("#menu"))}
$("#install").onclick=async()=>{await hide($("#menu"));await show($("#dialog"))}
$("#confirm").onclick=async()=>{
  hide($("#dialog"));await wait(350)
  await show($("#home"),450);$("#chrome").hidden=true;$("#scrim").hidden=true
  await wait(500);$("#kt").style.visibility="visible";show($("#kt"),450);show($("#toast"),380)
}
$("#kt").onclick=async()=>{await hide($("#toast"),200);await show($("#standalone"),450);$("#home").hidden=true}
`,
  )

export const ios = () =>
  base(
    `<div class="phone"><div class="screen">
  <div class="status"><span>14:05</span><span>5G ▮</span></div>
  <section class="layer" id="safari">
    <iframe style="position:absolute;top:28px;left:0" width="328" height="600" src="${APP}"></iframe>
    <div style="position:absolute;left:0;right:0;bottom:0;height:100px;background:var(--s1)">
      <div style="margin:8px 14px 0;height:40px;border-radius:14px;background:var(--s2);display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px">${lock}<span>${SITE}</span></div>
      <div style="display:flex;justify-content:space-around;margin-top:8px;color:var(--soft)">
        <button style="width:44px;height:36px;display:grid;place-items:center"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M14.5 5l-7 7 7 7"/></svg></button>
        <button style="width:44px;height:36px;display:grid;place-items:center"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M9.5 5l7 7-7 7"/></svg></button>
        <button id="share" style="width:44px;height:36px;display:grid;place-items:center;border-radius:12px;color:var(--ink)"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 15V3m-4 4l4-4 4 4"/><path d="M7 10H6a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2h-1"/></svg></button>
        <button style="width:44px;height:36px;display:grid;place-items:center"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 4h14v17l-7-4.5L5 21z"/></svg></button>
        <button style="width:44px;height:36px;display:grid;place-items:center"><svg width="22" height="22" viewBox="0 0 24 24"><rect x="4" y="7" width="13" height="13" rx="2.5"/><path d="M8 4h11a1 1 0 011 1v11"/></svg></button>
      </div>
    </div>
  </section>
  <div class="scrim" id="scrim" hidden></div>
  <div class="sheet" id="sharesheet" hidden style="left:8px;right:8px;bottom:8px;border-radius:26px;padding:16px 0 8px">
    <div style="display:flex;align-items:center;gap:12px;padding:0 18px 12px"><img src="/icons/icon-192.png" width="40" height="40" style="border-radius:10px" alt="">
      <div><div style="font-weight:600;font-size:15px">Kyiv Time</div><div style="font-size:12px;color:var(--soft)">${SITE}</div></div></div>
    <div class="row" style="height:48px">Copy</div>
    <div class="row" style="height:48px">Add to Bookmarks</div>
    <div class="row" id="addhome" style="height:48px;justify-content:space-between">Add to Home Screen<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/></svg></div>
    <div class="row" style="height:48px">Add to Reading List</div>
  </div>
  <div class="sheet" id="addsheet" hidden style="left:0;right:0;top:56px;bottom:0;border-radius:26px 26px 0 0;padding:18px 18px">
    <div style="display:flex;align-items:center;justify-content:space-between;height:36px;font-size:15px"><button style="color:var(--soft)">Cancel</button><b>Add to Home Screen</b><button id="add" style="color:var(--coral);font-weight:600">Add</button></div>
    <div style="margin-top:22px;border-radius:16px;background:var(--s1);display:flex;align-items:center;gap:14px;padding:14px"><img src="/icons/icon-192.png" width="58" height="58" style="border-radius:14px" alt="">
      <div style="flex:1"><div style="font-size:16px;font-weight:600;padding-bottom:8px;border-bottom:1px solid var(--s3)">Kyiv Time</div><div style="font-size:12px;color:var(--soft);padding-top:8px">${SITE}</div></div></div>
    <p style="margin-top:14px;font-size:12px;color:var(--soft);line-height:1.5">An icon will be added to your Home Screen so you can quickly access this website.</p>
  </div>
  <section class="layer" id="home" hidden style="background:var(--paper)"><div class="grid">${home(["Phone", "Messages", "Camera", "Photos", "Maps", "Mail", "Notes"])}</div></section>
  <section class="layer" id="standalone" hidden><iframe style="position:absolute;top:28px;left:0" width="328" height="676" src="${APP}"></iframe></section>
</div></div>`,
    `
$("#share").onclick=()=>{show($("#scrim"),300);show($("#sharesheet"))}
$("#addhome").onclick=async()=>{await hide($("#sharesheet"));await show($("#addsheet"))}
$("#add").onclick=async()=>{
  hide($("#addsheet"));await wait(300)
  await show($("#home"),450);$("#safari").hidden=true;$("#scrim").hidden=true
  await wait(500);$("#kt").style.visibility="visible";show($("#kt"),450)
}
$("#kt").onclick=async()=>{await show($("#standalone"),450);$("#home").hidden=true}
`,
  )

const BACK = `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M19 12H5m6-6l-6 6 6 6"/></svg>`
const FWD = `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 12h14m-6-6l6 6-6 6"/></svg>`
const RELOAD = `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M20 12a8 8 0 11-2.6-5.9M20 4v5h-5"/></svg>`
const INSTALL_ICON = `<svg width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 7.5v5m-2.2-2l2.2 2.2 2.2-2.2M8 20h8"/></svg>`
const STAR = `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z"/></svg>`

// A generic desktop browser window, drawn at 960 wide and shown at half size.
const desktopCss = `
.win{position:absolute;left:0;top:34px;width:960px;height:960px;zoom:.5;background:var(--s1);border-radius:16px;overflow:hidden;border:2px solid var(--s2)}
#tabs{height:56px;background:var(--paper);display:flex;align-items:flex-end;padding:0 14px 0 90px;gap:4px;position:relative}
#tabs::before{content:"";position:absolute;left:22px;top:20px;width:12px;height:12px;border-radius:50%;background:var(--s3);box-shadow:20px 0 var(--s3),40px 0 var(--s3)}
.tab{height:44px;border-radius:12px 12px 0 0;display:flex;align-items:center;gap:10px;padding:0 14px;font-size:15px;white-space:nowrap;overflow:hidden}
.tab img{width:20px;height:20px;border-radius:5px;flex:none}
.tab .x{margin-left:auto;color:var(--soft);font-size:18px}
#t1{background:var(--s1);width:230px}
#t2{width:200px;color:var(--soft)}
#t2 i{width:20px;height:20px;border-radius:50%;border:2px solid var(--s3);flex:none}
#toolbar{height:64px;background:var(--s1);display:flex;align-items:center;gap:6px;padding:0 14px}
#toolbar button{width:40px;height:40px;display:grid;place-items:center;border-radius:20px;color:var(--soft)}
.pill{flex:1;height:42px;border-radius:21px;background:var(--s2);display:flex;align-items:center;gap:10px;padding:0 6px 0 18px;font-size:15px;color:var(--ink)}
.pill .site{flex:1;display:flex;align-items:center;gap:8px}
#page{height:100%}
#menu{position:absolute;z-index:5;background:var(--s2);border-radius:14px;padding:8px 0;width:300px;font-size:15px}
#menu .row{height:40px;padding:0 20px}
#pop{position:absolute;z-index:5;right:40px;top:130px;width:360px;background:var(--s2);border-radius:20px;padding:24px 24px 18px}
#titlebar{height:48px;background:var(--paper);position:relative;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600}
#titlebar::before{content:"";position:absolute;left:22px;top:18px;width:12px;height:12px;border-radius:50%;background:var(--s3);box-shadow:20px 0 var(--s3),40px 0 var(--s3)}
`

const desktopBody = `<div class="win" id="win">
  <div id="tabs"><div class="tab" id="t1"><img src="/icons/icon-192.png" alt=""><span>Kyiv Time</span><span class="x">×</span></div><div class="tab" id="t2"><i></i><span>New Tab</span></div></div>
  <div id="toolbar"><button>${BACK}</button><button>${FWD}</button><button>${RELOAD}</button>
    <div class="pill"><span class="site">${lock}<span>${SITE}/kyiv-time/</span></span><button id="inst" style="width:36px;height:36px;color:var(--ink)">${INSTALL_ICON}</button><button style="width:36px;height:36px">${STAR}</button></div>
    <button>${dots}</button></div>
  <iframe id="pg" style="width:960px;height:850px;display:block" src="/?c=tokyo-jp,new-york-city-us&h=12&g=0"></iframe>
  <div id="pop" hidden>
    <div style="display:flex;align-items:center;gap:16px"><img src="/icons/icon-192.png" width="56" height="56" style="border-radius:14px" alt="">
      <div><div style="font-weight:600;font-size:18px">Install app?</div><div style="font-size:14px;color:var(--soft);margin-top:2px">Kyiv Time · ${SITE}</div></div></div>
    <div class="btns" style="margin-top:24px"><button class="no">Cancel</button><button class="go" id="confirm">Install</button></div>
  </div>
  <nav id="menu" hidden style="left:90px;top:56px">
    <div class="row">New tab to the right</div><div class="row">Reload</div><div class="row">Duplicate</div>
    <div class="row" id="pin">Pin</div><div class="row">Mute site</div><div class="row">Close</div>
  </nav>
</div>`

export const desktop = () =>
  base(
    desktopBody,
    `
$("#inst").onclick=()=>show($("#pop"),320)
$("#confirm").onclick=async()=>{
  await hide($("#pop"),200)
  const win=$("#win")
  await win.animate([{opacity:1,filter:"blur(0)"},{opacity:0,filter:"blur(8px)"}],{duration:260,easing:EASE,fill:"forwards"}).finished
  $("#tabs").hidden=true;$("#toolbar").hidden=true
  $("#tabs").insertAdjacentHTML("beforebegin",'<div id="titlebar">Kyiv Time</div>')
  win.style.left="30px";win.style.width="900px";win.style.height="920px";$("#pg").style.width="900px";$("#pg").style.height="872px"
  await win.animate([{opacity:0,filter:"blur(8px)"},{opacity:1,filter:"blur(0)"}],{duration:420,easing:EASE,fill:"forwards"}).finished
}
`,
    desktopCss,
  )

export const pin = () =>
  base(
    desktopBody,
    `
document.addEventListener("contextmenu",e=>{e.preventDefault();if(e.target.closest("#t1"))show($("#menu"),260)})
$("#pin").onclick=async()=>{
  await hide($("#menu"),200)
  const t1=$("#t1"),label=t1.querySelector("span"),x=t1.querySelector(".x")
  await t1.animate([{width:"230px"},{width:"52px"}],{duration:420,easing:EASE,fill:"forwards"}).finished
  label.hidden=true;x.hidden=true;t1.style.padding="0 16px"
}
`,
    desktopCss,
  )
