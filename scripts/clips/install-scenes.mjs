// Light-mode mock-ups of the install and pin flows, drawn for the stage in stage.mjs. Browser and OS chrome
// can't be screen-recorded from a page, so these draw a generic version of each step; the app inside
// is the real one. Monochrome on purpose: only coral marks what to tap. Nothing here moves by itself:
// every layer is always laid out, and the clip's timeline shows and hides it.

export const SITE = "qn34uc59t.github.io"
const APP = "/?c=tokyo-jp,new-york-city-us&h=12&g=0"

const base = (body, css = "") => `<!doctype html><meta charset="utf-8">
<style>
@font-face{font-family:"Inter Variable";src:url("/node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2") format("woff2");font-weight:100 900}
:root{--bg:#ece7e0;--paper:#f6f2ec;--ink:#1d1a17;--soft:#6f675e;--coral:#ee6a58;--bar:#ebe6df;--sheet:#fdfbf8;--slot:#dcd5cc;--line:#e4ded6}
*{box-sizing:border-box;margin:0}
html,body{background:var(--bg);color:var(--ink);font-family:"Inter Variable",system-ui,sans-serif;overflow:hidden;-webkit-font-smoothing:antialiased}
button{font:inherit;color:inherit;background:none;border:0;padding:0}
svg{display:block;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
iframe{border:0;display:block;pointer-events:none;background:var(--paper)}
.layer{position:absolute;inset:0}
.scrim{position:absolute;inset:0;background:rgba(29,26,23,.26)}
.sheet{position:absolute;background:var(--sheet)}
.row{display:flex;align-items:center;gap:14px;height:46px;padding:0 16px;font-size:14px;white-space:nowrap}
.row svg{width:20px;height:20px;color:var(--soft);flex:none}
.btns{display:flex;justify-content:flex-end;gap:8px}
.btns button{height:40px;padding:0 18px;border-radius:20px;font-size:14px;font-weight:600}
.btns .go{background:var(--coral);color:#fff}
.btns .no{color:var(--coral)}
.kt{border-radius:22%;display:block}
${css}
</style>
${body}`

const lock = `<svg width="13" height="13" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>`
const dots = `<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/></svg>`

// ——— Phones ———
const phoneCss = `
.phone{position:absolute;left:62px;top:14px;width:356px;height:732px;border-radius:52px;background:var(--ink);padding:9px}
.screen{position:relative;width:100%;height:100%;border-radius:43px;background:var(--paper);overflow:hidden}
.status{position:absolute;left:0;right:0;top:0;height:40px;padding:15px 30px 0;display:flex;justify-content:space-between;font-size:13px;font-weight:620;z-index:9}
.status i{width:24px;height:11px;border-radius:3px;border:1.5px solid var(--ink);position:relative;top:2px}
.status i::after{content:"";position:absolute;inset:1.5px;right:5px;background:var(--ink);border-radius:1px}
.home{background:var(--bar)}
.grid{position:absolute;left:14px;right:14px;top:78px;display:grid;grid-template-columns:repeat(4,1fr);row-gap:24px}
.app{display:grid;justify-items:center;gap:7px;font-size:11px}
.app i{width:58px;height:58px;border-radius:15px;background:var(--slot)}
.app .kt{width:58px;height:58px;border-radius:15px}
.dock{position:absolute;left:14px;right:14px;bottom:14px;height:86px;border-radius:30px;background:var(--slot);opacity:.55}
.standalone{background:var(--paper);transform-origin:0 0}
.toast{left:50%;translate:-50% 0;bottom:122px;border-radius:22px;padding:11px 18px;font-size:13px;white-space:nowrap;background:var(--ink);color:var(--paper)}
`
const homeScreen = (id, apps) => `
  <section class="layer home" id="${id}">
    <div class="grid">${apps.map((l) => `<div class="app"><i></i><span>${l}</span></div>`).join("")}
      <div class="app" id="kt"><img class="kt" src="/icons/icon-192.png" alt=""><span>Kyiv Time</span></div></div>
    <div class="dock"></div>
  </section>`
const standalone = `<section class="layer standalone" id="standalone"><iframe style="position:absolute;top:40px;left:0" width="338" height="674" src="${APP}"></iframe></section>`
const status = `<div class="status"><span>14:05</span><i></i></div>`

export const android = () =>
  base(
    `<div class="phone"><div class="screen">
  ${status}
  ${homeScreen("home", ["Phone", "Messages", "Camera", "Photos", "Maps", "Mail", "Notes"])}
  <section class="layer" id="browser" style="background:var(--paper)">
    <div style="position:absolute;top:40px;left:0;right:0;height:56px;display:flex;align-items:center;gap:4px;padding:0 6px 0 12px;background:var(--bar)">
      <div style="flex:1;height:40px;border-radius:20px;background:var(--sheet);display:flex;align-items:center;gap:8px;padding:0 14px;font-size:13px">${lock}<span>${SITE}</span></div>
      <button style="width:34px;height:34px;display:grid;place-items:center;border:1.8px solid var(--ink);border-radius:8px;font-size:12px;font-weight:650;margin:0 2px">1</button>
      <button id="menu-btn" style="width:42px;height:44px;display:grid;place-items:center;border-radius:14px">${dots}</button>
    </div>
    <iframe style="position:absolute;top:96px;left:0" width="338" height="618" src="${APP}"></iframe>
  </section>
  <div class="scrim" id="scrim"></div>
  <nav class="sheet" id="menu" style="top:90px;right:8px;width:222px;border-radius:18px;padding:6px 0;transform-origin:100% 0">
    <div class="row">New tab</div><div class="row">History</div><div class="row">Downloads</div>
    <div class="row" id="install" style="border-radius:12px;margin:0 6px;padding:0 10px"><svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M12 8v6m-3-2.5l3 3 3-3"/></svg>Install app</div>
    <div class="row">Share…</div><div class="row">Find in page</div><div class="row">Settings</div>
  </nav>
  <div class="sheet" id="dialog" style="left:22px;right:22px;top:262px;border-radius:28px;padding:24px 22px 18px">
    <div style="display:flex;align-items:center;gap:14px"><img class="kt" src="/icons/icon-192.png" width="52" height="52" alt="">
      <div><div style="font-weight:620;font-size:17px">Install app?</div><div style="font-size:13px;color:var(--soft);margin-top:2px">Kyiv Time · ${SITE}</div></div></div>
    <div class="btns" style="margin-top:26px"><button class="no">Cancel</button><button class="go" id="confirm">Install</button></div>
  </div>
  <div class="sheet toast" id="toast">Kyiv Time added to Home screen</div>
  ${standalone}
</div></div>`,
    phoneCss,
  )

export const ios = () =>
  base(
    `<div class="phone"><div class="screen">
  ${status}
  ${homeScreen("home", ["Phone", "Messages", "Camera", "Photos", "Maps", "Mail", "Notes"])}
  <section class="layer" id="browser" style="background:var(--paper)">
    <iframe style="position:absolute;top:40px;left:0" width="338" height="586" src="${APP}"></iframe>
    <div style="position:absolute;left:0;right:0;bottom:0;height:88px;background:var(--bar)">
      <div style="margin:8px 14px 0;height:40px;border-radius:14px;background:var(--sheet);display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px">${lock}<span>${SITE}</span></div>
      <div style="display:flex;justify-content:space-around;margin-top:2px;color:var(--soft)">
        <button style="width:44px;height:38px;display:grid;place-items:center"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M14.5 5l-7 7 7 7"/></svg></button>
        <button style="width:44px;height:38px;display:grid;place-items:center"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M9.5 5l7 7-7 7"/></svg></button>
        <button id="share" style="width:44px;height:38px;display:grid;place-items:center;border-radius:12px;color:var(--ink)"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 15V3m-4 4l4-4 4 4"/><path d="M7 10H6a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2h-1"/></svg></button>
        <button style="width:44px;height:38px;display:grid;place-items:center"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 4h14v17l-7-4.5L5 21z"/></svg></button>
        <button style="width:44px;height:38px;display:grid;place-items:center"><svg width="22" height="22" viewBox="0 0 24 24"><rect x="4" y="7" width="13" height="13" rx="2.5"/><path d="M8 4h11a1 1 0 011 1v11"/></svg></button>
      </div>
    </div>
  </section>
  <div class="scrim" id="scrim"></div>
  <div class="sheet" id="sharesheet" style="left:8px;right:8px;bottom:8px;border-radius:34px;padding:18px 0 10px">
    <div style="display:flex;align-items:center;gap:12px;padding:0 20px 12px"><img class="kt" src="/icons/icon-192.png" width="42" height="42" alt="">
      <div><div style="font-weight:620;font-size:15px">Kyiv Time</div><div style="font-size:12px;color:var(--soft)">${SITE}</div></div></div>
    <div class="row" style="height:48px;padding:0 20px">Copy</div>
    <div class="row" style="height:48px;padding:0 20px">Add to Bookmarks</div>
    <div class="row" id="addhome" style="height:48px;margin:0 8px;padding:0 12px;border-radius:14px;justify-content:space-between">Add to Home Screen<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/></svg></div>
    <div class="row" style="height:48px;padding:0 20px">Add to Reading List</div>
  </div>
  <div class="sheet" id="addsheet" style="left:0;right:0;top:52px;bottom:0;border-radius:30px 30px 0 0;padding:16px 18px">
    <div style="display:flex;align-items:center;justify-content:space-between;height:40px;font-size:15px"><button style="color:var(--soft)">Cancel</button><b style="font-weight:620">Add to Home Screen</b><button id="add" style="color:var(--coral);font-weight:650;padding:0 8px;height:36px;border-radius:12px">Add</button></div>
    <div style="margin-top:20px;border-radius:16px;background:var(--bar);display:flex;align-items:center;gap:14px;padding:14px"><img class="kt" src="/icons/icon-192.png" width="58" height="58" alt="">
      <div style="flex:1"><div style="font-size:16px;font-weight:620;padding-bottom:8px;border-bottom:1px solid var(--slot)">Kyiv Time</div><div style="font-size:12px;color:var(--soft);padding-top:8px">${SITE}</div></div></div>
    <p style="margin-top:14px;font-size:12px;color:var(--soft);line-height:1.5">An icon will be added to your Home Screen so you can quickly access this website.</p>
  </div>
  ${standalone}
</div></div>`,
    phoneCss,
  )

// ——— Desktop: a generic browser window, drawn at 960 wide and shown at half size ———
const BACK = `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M19 12H5m6-6l-6 6 6 6"/></svg>`
const FWD = `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 12h14m-6-6l6 6-6 6"/></svg>`
const RELOAD = `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M20 12a8 8 0 11-2.6-5.9M20 4v5h-5"/></svg>`
const INSTALL_ICON = `<svg width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 7.5v5m-2.2-2l2.2 2.2 2.2-2.2M8 20h8"/></svg>`
const STAR = `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z"/></svg>`

const desktopCss = `
#desk{position:absolute;inset:0;zoom:.5;width:960px;height:1120px}
.lights{position:absolute;left:22px;width:12px;height:12px;border-radius:50%;background:var(--slot);box-shadow:20px 0 var(--slot),40px 0 var(--slot)}
.win{position:absolute;background:var(--paper);border-radius:18px;overflow:hidden;outline:2px solid var(--slot);transform-origin:0 0}
#browser{left:40px;top:60px;width:880px;height:880px}
#tabs{height:56px;background:var(--bar);display:flex;align-items:flex-end;padding:0 14px 0 90px;gap:4px;position:relative}
#tabs .lights{top:22px}
.tab{height:44px;border-radius:12px 12px 0 0;display:flex;align-items:center;gap:10px;padding:0 14px;font-size:15px;white-space:nowrap;overflow:hidden}
.tab img{width:20px;height:20px;border-radius:5px;flex:none}
.tab .x{margin-left:auto;color:var(--soft);font-size:18px}
#t1{background:var(--paper);width:230px}
#t2{width:200px;color:var(--soft)}
#t2 i{width:20px;height:20px;border-radius:50%;border:2px solid var(--slot);flex:none}
#toolbar{height:64px;background:var(--paper);display:flex;align-items:center;gap:6px;padding:0 14px}
#toolbar button{width:40px;height:40px;display:grid;place-items:center;border-radius:20px;color:var(--soft)}
.pill{flex:1;height:44px;border-radius:22px;background:var(--bar);display:flex;align-items:center;gap:10px;padding:0 4px 0 18px;font-size:15px}
.pill .site{flex:1;display:flex;align-items:center;gap:8px}
#inst{color:var(--ink)!important}
#pop{position:absolute;right:120px;top:186px;width:380px;border-radius:22px;padding:26px 26px 20px;background:var(--sheet);outline:2px solid var(--slot);transform-origin:85% 0}
#appwin{left:150px;top:120px;width:700px;height:860px}
#appwin .bar{height:48px;background:var(--bar);position:relative;display:flex;align-items:center;justify-content:center;gap:10px;font-size:15px;font-weight:600}
#appwin .bar .lights{top:18px}
#appwin .bar img{width:20px;height:20px;border-radius:5px}
#dock{position:absolute;left:50%;translate:-50% 0;bottom:36px;height:84px;padding:12px;border-radius:26px;background:var(--bar);outline:2px solid var(--slot);display:flex;gap:12px}
#dock i,#dock img{width:60px;height:60px;border-radius:15px;background:var(--slot);display:block}
#dock-kt{width:0;margin-left:-12px;position:relative}
#dock-kt img{position:absolute;left:12px;top:0;background:none}
`

const browserWin = `<div class="win" id="browser">
    <div id="tabs"><span class="lights"></span><div class="tab" id="t1"><img src="/icons/icon-192.png" alt=""><span>Kyiv Time</span><span class="x">×</span></div><div class="tab" id="t2"><i></i><span>New Tab</span></div></div>
    <div id="toolbar"><button>${BACK}</button><button>${FWD}</button><button>${RELOAD}</button>
      <div class="pill"><span class="site">${lock}<span>${SITE}/kyiv-time/</span></span><button id="inst" style="width:38px;height:38px;border-radius:19px">${INSTALL_ICON}</button><button style="width:38px;height:38px">${STAR}</button></div>
      <button>${dots}</button></div>
    <iframe style="width:880px;height:760px" src="${APP}"></iframe>
  </div>`
const dock = `<div id="dock"><i></i><i></i><i></i><i></i><span id="dock-kt"><img id="dock-icon" src="/icons/icon-192.png" alt=""></span></div>`

export const desktop = () =>
  base(
    `<div id="desk">
  ${browserWin}
  <div class="win" id="appwin">
    <div class="bar"><span class="lights"></span><img src="/icons/icon-192.png" alt="">Kyiv Time</div>
    <iframe style="width:700px;height:812px" src="${APP}"></iframe>
  </div>
  <div id="pop">
    <div style="display:flex;align-items:center;gap:16px"><img class="kt" src="/icons/icon-192.png" width="56" height="56" alt="">
      <div><div style="font-weight:620;font-size:18px">Install app?</div><div style="font-size:14px;color:var(--soft);margin-top:2px">Kyiv Time · ${SITE}</div></div></div>
    <div class="btns" style="margin-top:24px"><button class="no">Cancel</button><button class="go" id="confirm">Install</button></div>
  </div>
  ${dock}
</div>`,
    desktopCss,
  )

// Pinning works in any desktop browser, installed or not.
export const pin = () =>
  base(
    `<div id="desk">
  ${browserWin}
  <nav id="menu">
    <div class="row">New tab to the right</div><div class="row">Reload</div><div class="row">Duplicate</div>
    <div class="row" id="pin">Pin</div><div class="row">Mute site</div><div class="row">Close</div>
  </nav>
  ${dock}
</div>`,
    desktopCss +
      `#menu{position:absolute;left:250px;top:104px;width:300px;border-radius:18px;padding:8px 0;background:var(--sheet);outline:2px solid var(--slot);font-size:15px;transform-origin:0 0}
#menu .row{height:42px;padding:0 14px;margin:0 8px;border-radius:12px}
#t1{flex:none}
#t1 .x,#t1 span{flex:none}`,
  )
