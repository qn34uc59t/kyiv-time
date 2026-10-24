/** First-open screen: what the app is, and a short silent clip of how to put it on a home screen or pin it. Opens once, and again from the "?" button. */

const SEEN_KEY = "kyiv-time:tour"

interface Variant {
  id: string
  label: string
  clip: string
  hint: string
}

const VARIANTS: Variant[] = [
  { id: "android", label: "Android", clip: "android", hint: "Chrome menu, then Install app" },
  { id: "iphone", label: "iPhone", clip: "ios", hint: "Safari, Share, then Add to Home Screen" },
  { id: "computer", label: "Computer", clip: "desktop", hint: "Chrome or Edge, install icon in the address bar" },
  { id: "pin", label: "Pin tab", clip: "pin", hint: "Right-click the tab, then Pin" },
]

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const dialog = $<HTMLDialogElement>("tour")
const stepEl = $("tour-step")
const video = $<HTMLVideoElement>("tour-video")
const tabsEl = $("tour-tabs")

const motionOK = () => !matchMedia("(prefers-reduced-motion: reduce)").matches

/** Already installed, so the install step has nothing to teach. */
const isInstalled = () =>
  matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true

function platform(): string {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return "android"
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "iphone"
  return "computer"
}

let variantId = platform()

/** Installed already, so there is nothing left to show. */
export const tourUseful = () => !isInstalled()

export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1"
  } catch {
    return false
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1")
  } catch {
    /* private mode: it will simply show again next visit */
  }
}

// Clips are fetched whole and played from a blob, so one download feeds both the player and the offline cache.
const clipUrls = new Map<string, Promise<string>>()
function loadClip(name: string): Promise<string> {
  let p = clipUrls.get(name)
  if (!p) {
    p = fetch(`./clips/${name}.mp4`)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((b) => URL.createObjectURL(b))
    p.catch(() => clipUrls.delete(name))
    clipUrls.set(name, p)
  }
  return p
}

let shown = ""
async function playClip(name: string) {
  shown = name
  video.poster = `./clips/${name}.jpg`
  video.removeAttribute("src")
  video.load()
  try {
    const url = await loadClip(name)
    if (shown !== name || !dialog.open) return
    video.src = url
    if (motionOK()) await video.play()
  } catch {
    // Offline and not cached yet, or autoplay refused: fall back to the still.
    if (shown === name) {
      video.removeAttribute("src")
      video.load()
    }
  }
}

function resolveIn() {
  if (!motionOK()) return
  stepEl.animate(
    [{ filter: "blur(8px)", opacity: 0.3 }, { filter: "blur(0px)", opacity: 1 }],
    { duration: 400, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
  )
}

function render(animate = true) {
  const variant = VARIANTS.find((v) => v.id === variantId) ?? VARIANTS[0]
  tabsEl.innerHTML = VARIANTS.map(
    (v) => `<button type="button" role="tab" aria-selected="${v === variant}" data-variant="${v.id}">${v.label}</button>`,
  ).join("")
  video.setAttribute("aria-label", `How to add it: ${variant.hint}. Tap to play or pause.`)
  playClip(variant.clip)
  if (animate) resolveIn()
}

export function openTour() {
  if (dialog.open) return
  variantId = platform()
  dialog.showModal()
  render(false)
}

$("tour-enter").addEventListener("click", () => dialog.close())
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close()
})
tabsEl.addEventListener("click", (e) => {
  const tab = (e.target as HTMLElement).closest<HTMLElement>("[data-variant]")
  if (!tab) return
  variantId = tab.dataset.variant!
  render()
})
video.addEventListener("click", () => (video.paused ? video.play().catch(() => {}) : video.pause()))
video.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    video.click()
  }
})
dialog.addEventListener("close", () => {
  video.pause()
  shown = ""
  markSeen()
})

/** Desktop browsers get a quiet pointer at the "?" instead of a full-screen welcome, once. */
export function showHint() {
  const hint = $("help-hint")
  markSeen()
  const hide = () => {
    document.removeEventListener("pointerdown", hide, true)
    document.removeEventListener("keydown", hide, true)
    if (hint.hidden) return
    if (!motionOK()) return void (hint.hidden = true)
    hint
      .animate([{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(8px)" }], { duration: 300, easing: "cubic-bezier(0.4, 0, 0.2, 1)" })
      .finished.then(() => (hint.hidden = true))
  }
  setTimeout(() => {
    hint.hidden = false
    if (motionOK()) hint.animate([{ opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)" }], { duration: 400, easing: "cubic-bezier(0.4, 0, 0.2, 1)" })
    document.addEventListener("pointerdown", hide, true)
    document.addEventListener("keydown", hide, true)
    setTimeout(hide, 12000)
  }, 1200)
}
