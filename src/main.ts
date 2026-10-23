import type { GlobeView, Pin } from "./globe"
import { KYIV_CITY, MAX_EXTRA, getCity, searchCities } from "./cities"
import { addCity, getState, moveCity, removeCity, replaceCity, setGlobe, setHour12, subscribe } from "./state"
import { getInstant, msUntilLive, getOffset, isLive, offsetLabel, reset, setOffset } from "./scrub"
import { KYIV, dayDiff, formatShortDate, dayLabel, diffFromKyiv, formatClock, formatDate, utcLabel } from "./time"

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const timeEl = $("kyiv-time")
const metaEl = $("kyiv-meta")
const rowsEl = $("rows")
const addBtn = $<HTMLButtonElement>("add-btn")
const switchEl = $<HTMLButtonElement>("hour-switch")
const globeSwitch = $<HTMLButtonElement>("globe-switch")
const globeEl = $("globe")
const picker = $<HTMLDialogElement>("picker")
const qEl = $<HTMLInputElement>("q")
const resultsEl = $("results")
const scrubTitle = $("scrub-title")
const scrubSub = $("scrub-sub")
const scrubRange = $<HTMLInputElement>("scrub-range")
const nowBtn = $<HTMLButtonElement>("now-btn")
const scrubHead = $("scrub-head")

const clockHtml = (at: Date, tz: string, hour12: boolean) => {
  const { h, m, suffix } = formatClock(at, tz, hour12)
  return `${h}<span class="sep">:</span>${m}${suffix ? `<span class="ampm">${suffix}</span>` : ""}`
}

/** Skips the write when nothing changed, so the colon's pulse isn't restarted every tick. */
function setHtml(el: Element, html: string) {
  const host = el as HTMLElement
  if (host.dataset.h === html) return
  host.dataset.h = html
  el.innerHTML = html
}

const PENCIL = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>`

function clockText(at: Date, tz: string, hour12: boolean) {
  const { h, m, suffix } = formatClock(at, tz, hour12)
  return `${h}:${m}${suffix ? " " + suffix : ""}`
}

function pinsAt(at: Date): Pin[] {
  const { ids, hour12 } = getState()
  return [KYIV_CITY.id, ...ids].map((id) => {
    const c = getCity(id)!
    return { id, name: c.name, lat: c.lat, lon: c.lon, time: clockText(at, c.tz, hour12), home: id === KYIV_CITY.id }
  })
}

let globe: GlobeView | null = null
let globeLoading = false

/** The globe (and WebGL lib) is fetched only when the switch is first turned on. */
async function syncGlobe() {
  const on = getState().globe
  globeEl.hidden = !on
  if (!on && globe) {
    globe.destroy()
    globe = null
  }
  if (!on || globe || globeLoading) return
  globeLoading = true
  try {
    const { mountGlobe } = await import("./globe")
    // The switch may have been turned off again while the chunk loaded.
    if (getState().globe && !globe) {
      globe = mountGlobe(globeEl, pinsAt(getInstant()))
      globe.setSpinning(isLive())
    }
  } finally {
    globeLoading = false
  }
}

const GRIP = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>`

const rowMeta = (at: Date, tz: string) =>
  `${diffFromKyiv(at, tz)} · ${dayLabel(dayDiff(at, tz))}`

const motionOK = () => !matchMedia("(prefers-reduced-motion: reduce)").matches
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)"
const ROW_GAP = 28
const BLUR = "blur(8px)"

const gripFor = (id: string, name: string) =>
  `<button class="icon grip" type="button" aria-label="Move ${name}. Drag, or use the up and down arrow keys." data-move="${id}">${GRIP}</button>`

function createRow(id: string): HTMLLIElement {
  const c = getCity(id)!
  const li = document.createElement("li")
  li.dataset.id = id
  li.innerHTML = `
    <div class="who"><span class="name">${c.name}</span><span class="label">${c.country}</span></div>
    <div class="when"><span class="time num" data-time></span><span class="label" data-meta></span></div>
    <button class="icon" type="button" aria-label="Change ${c.name}" data-edit="${id}">${PENCIL}</button>
    <button class="icon remove" type="button" aria-label="Remove ${c.name}" data-remove="${id}">×</button>`
  return li
}

const liveRows = () => [...rowsEl.querySelectorAll<HTMLLIElement>("li:not([data-leaving])")]

/** A row grows in from nothing, sharpening as it arrives. */
function enterRow(li: HTMLElement) {
  if (!motionOK()) return
  const h = li.getBoundingClientRect().height
  li.style.overflow = "hidden"
  li.animate(
    [
      { height: "0px", marginBottom: "0px", opacity: 0, filter: BLUR },
      { height: `${h}px`, marginBottom: `${ROW_GAP}px`, opacity: 1, filter: "blur(0px)" },
    ],
    { duration: 380, easing: EASE },
  ).finished.then(() => (li.style.overflow = ""), () => (li.style.overflow = ""))
}

/** A row blurs out and the ones below slide up into its place. */
function leaveRow(li: HTMLElement) {
  li.dataset.leaving = ""
  li.inert = true
  if (!motionOK()) return li.remove()
  const h = li.getBoundingClientRect().height
  li.style.overflow = "hidden"
  li.animate(
    [
      { height: `${h}px`, marginBottom: `${ROW_GAP}px`, opacity: 1, filter: "blur(0px)" },
      { height: "0px", marginBottom: "0px", opacity: 0, filter: BLUR },
    ],
    { duration: 320, easing: EASE, fill: "forwards" },
  ).finished.then(() => li.remove(), () => li.remove())
}

/** Updates the list in place, so only rows that actually come or go animate, and clicks never land on a replaced node. */
let firstRender = true
function renderRows() {
  const { ids } = getState()
  const sortable = ids.length > 1
  rowsEl.classList.toggle("sortable", sortable)

  const existing = new Map(liveRows().map((li) => [li.dataset.id!, li]))
  for (const [id, li] of existing) if (!ids.includes(id)) leaveRow(li)

  const entering: HTMLElement[] = []
  const wanted = ids.map((id) => {
    let li = existing.get(id)
    if (!li) {
      li = createRow(id)
      entering.push(li)
    }
    const grip = li.querySelector("[data-move]")
    if (sortable && !grip) li.insertAdjacentHTML("afterbegin", gripFor(id, getCity(id)!.name))
    if (!sortable && grip) grip.remove()
    return li
  })

  // Put rows in order, leaving any still-fading rows where they are.
  const nextLive = (el: Element | null): Element | null => {
    while (el && (el as HTMLElement).dataset.leaving !== undefined) el = el.nextElementSibling
    return el
  }
  let ref = nextLive(rowsEl.firstElementChild)
  for (const li of wanted) {
    if (li === ref) ref = nextLive(ref.nextElementSibling)
    else rowsEl.insertBefore(li, ref)
  }

  const full = ids.length >= MAX_EXTRA
  addBtn.disabled = full
  addBtn.textContent = full ? `${MAX_EXTRA} of ${MAX_EXTRA} cities tracked` : "Add a city"
  tick()
  if (!firstRender) entering.forEach(enterRow)
  firstRender = false
}

/** While a time is picked, a small bar above the slider says which time it is and offers the way back; it drops back to live when abandoned. */
function renderStatus() {
  const live = isLive()
  scrubHead.classList.toggle("open", !live)
  scrubHead.toggleAttribute("inert", live)
  if (live) return
  const left = msUntilLive()
  if (left === 0) return goLive()
  const at = getInstant()
  const { h, m, suffix } = formatClock(at, KYIV, getState().hour12)
  scrubTitle.textContent = `${formatShortDate(at, KYIV)}, ${h}:${m}${suffix ? " " + suffix : ""} Kyiv`
  scrubSub.textContent =
    left <= 60000 ? `Back to live in ${Math.ceil(left / 1000)} s` : offsetLabel(getOffset())
}

function tick() {
  renderStatus()
  const now = getInstant()
  const { ids, hour12 } = getState()
  setHtml(timeEl, clockHtml(now, KYIV, hour12))
  metaEl.textContent = `${KYIV_CITY.name}, ${KYIV_CITY.country} · ${formatDate(now, KYIV)} · ${utcLabel(now, KYIV)}`
  globe?.setPins(pinsAt(now))
  globe?.setSpinning(isLive())
  for (const id of ids) {
    const li = rowsEl.querySelector(`li[data-id="${id}"]:not([data-leaving])`)
    if (!li) continue
    const tz = getCity(id)!.tz
    setHtml(li.querySelector("[data-time]")!, clockHtml(now, tz, hour12))
    li.querySelector("[data-meta]")!.textContent = rowMeta(now, tz)
  }
}

function renderScrub() {
  const live = isLive()
  scrubRange.value = String(getOffset())
  timeEl.classList.toggle("scrubbed", !live)
  renderStatus()
}

scrubRange.addEventListener("input", () => {
  setOffset(Number(scrubRange.value))
  renderScrub()
  tick()
})

const goLive = () => {
  reset()
  renderScrub()
  tick()
}
nowBtn.addEventListener("click", goLive)

function renderSwitch() {
  switchEl.setAttribute("aria-checked", String(getState().hour12))
  globeSwitch.setAttribute("aria-checked", String(getState().globe))
}

rowsEl.addEventListener("click", (e) => {
  const target = e.target as HTMLElement
  const rm = target.closest<HTMLElement>("[data-remove]")
  if (rm) return removeCity(rm.dataset.remove!)
  const ed = target.closest<HTMLElement>("[data-edit]")
  if (ed) openPicker(ed.dataset.edit!)
})

switchEl.addEventListener("click", () => setHour12(!getState().hour12))
globeSwitch.addEventListener("click", () => setGlobe(!getState().globe))

// City picker
/** Set while swapping an existing row's city; null when adding. */
let editingId: string | null = null

function renderResults() {
  const found = searchCities(qEl.value, getState().ids)
  resultsEl.innerHTML = found.length
    ? found
        .map((c) => `<li><button type="button" data-add="${c.id}"><span class="name">${c.name}</span><span class="label">${c.country}</span></button></li>`)
        .join("")
    : qEl.value.trim()
      ? `<li class="empty label">No cities found</li>`
      : ""
}

function openPicker(replacing: string | null) {
  editingId = replacing
  qEl.value = ""
  qEl.placeholder = replacing ? `Replace ${getCity(replacing)!.name} with…` : "Search city or country"
  renderResults()
  fitPicker()
  picker.showModal()
  qEl.focus()
}

addBtn.addEventListener("click", () => openPicker(null))
qEl.addEventListener("input", renderResults)
resultsEl.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-add]")
  if (!btn) return
  if (editingId) replaceCity(editingId, btn.dataset.add!)
  else addCity(btn.dataset.add!)
  picker.close()
})
picker.addEventListener("click", (e) => {
  if (e.target === picker) picker.close()
})

// Reordering: drag the grip (touch or mouse), or focus it and press the arrow keys.
function startDrag(e: PointerEvent, handle: HTMLElement) {
  const li = handle.closest("li")!
  const items = liveRows()
  const from = items.indexOf(li)
  const rects = items.map((el) => el.getBoundingClientRect())
  const stride = rects[1].top - rects[0].top
  const startY = e.clientY
  let to = from
  e.preventDefault()
  handle.setPointerCapture(e.pointerId)
  li.classList.add("dragging")

  const move = (ev: PointerEvent) => {
    const y = Math.max(-from * stride, Math.min((items.length - 1 - from) * stride, ev.clientY - startY))
    li.style.transform = `translateY(${y}px)`
    to = Math.max(0, Math.min(items.length - 1, from + Math.round(y / stride)))
    items.forEach((el, i) => {
      if (el === li) return
      const shift = from < to && i > from && i <= to ? -stride : from > to && i >= to && i < from ? stride : 0
      el.style.transform = shift ? `translateY(${shift}px)` : ""
    })
  }
  const end = (commit: boolean) => {
    handle.removeEventListener("pointermove", move)
    handle.removeEventListener("pointerup", onUp)
    handle.removeEventListener("pointercancel", onCancel)
    document.removeEventListener("keydown", onKey)
    li.classList.remove("dragging")
    items.forEach((el) => (el.style.transform = ""))
    if (commit) moveCity(from, to)
  }
  const onUp = () => end(true)
  const onCancel = () => end(false)
  const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && end(false)
  handle.addEventListener("pointermove", move)
  handle.addEventListener("pointerup", onUp)
  handle.addEventListener("pointercancel", onCancel)
  document.addEventListener("keydown", onKey)
}

rowsEl.addEventListener("pointerdown", (e) => {
  const handle = (e.target as HTMLElement).closest<HTMLElement>("[data-move]")
  if (handle && e.button === 0) startDrag(e, handle)
})

rowsEl.addEventListener("keydown", (e) => {
  const handle = (e.target as HTMLElement).closest<HTMLElement>("[data-move]")
  if (!handle || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return
  e.preventDefault()
  const id = handle.dataset.move!
  const from = getState().ids.indexOf(id)
  moveCity(from, from + (e.key === "ArrowUp" ? -1 : 1))
  rowsEl.querySelector<HTMLElement>(`[data-move="${id}"]`)?.focus()
})

/** When the clock format flips, every clock changes at once; let them all resolve out of a blur together. */
let lastHour12 = getState().hour12
function resolveClocks() {
  if (!motionOK()) return
  const els = [timeEl, ...rowsEl.querySelectorAll<HTMLElement>("[data-time]")]
  for (const el of els) {
    el.animate([{ filter: BLUR, opacity: 0.3 }, { filter: "blur(0px)", opacity: 1 }], { duration: 420, easing: EASE })
  }
}

subscribe(() => {
  renderRows()
  renderSwitch()
  syncGlobe()
  if (getState().hour12 !== lastHour12) {
    lastHour12 = getState().hour12
    resolveClocks()
  }
})

renderRows()
renderSwitch()
syncGlobe()
renderScrub()
setInterval(tick, 1000)

// Attribution: hover on desktop; tap to toggle on touch.
const infoEl = $("info")
const infoBtn = $<HTMLButtonElement>("info-btn")
const setInfo = (open: boolean) => {
  infoEl.classList.toggle("open", open)
  infoBtn.setAttribute("aria-expanded", String(open))
}
infoBtn.addEventListener("click", () => setInfo(!infoEl.classList.contains("open")))
document.addEventListener("click", (e) => {
  if (!infoEl.contains(e.target as Node)) setInfo(false)
})
document.addEventListener("keydown", (e) => e.key === "Escape" && setInfo(false))

// Picker: Cancel button, and size the phone sheet to the visible area above the keyboard.
$("picker-close").addEventListener("click", () => picker.close())
const vv = window.visualViewport
function fitPicker() {
  if (!vv) return
  picker.style.setProperty("--vvh", `${vv.height}px`)
  picker.style.setProperty("--vvt", `${vv.offsetTop}px`)
}
// iOS pans the page when you drag inside the sheet, which tears the caret away from the field.
// Only the results list may scroll; any other touch-drag in the sheet is cancelled.
picker.addEventListener(
  "touchmove",
  (e) => {
    const list = (e.target as HTMLElement).closest<HTMLElement>(".results")
    if (!list || list.scrollHeight <= list.clientHeight) e.preventDefault()
  },
  { passive: false },
)
vv?.addEventListener("resize", fitPicker)
vv?.addEventListener("scroll", fitPicker)
picker.addEventListener("close", () => {
  picker.style.removeProperty("--vvh")
  picker.style.removeProperty("--vvt")
})
