import createGlobe from "cobe"

export interface Pin {
  id: string
  name: string
  lat: number
  lon: number
  /** Pre-formatted local time shown in the badge. */
  time: string
  home?: boolean
}

export interface GlobeView {
  setPins(pins: Pin[]): void
  /** Pause or resume the slow turn; the view stays where it is. */
  setSpinning(on: boolean): void
  destroy(): void
}

type Rgb = [number, number, number]

const CORAL: Rgb = [0.93, 0.42, 0.35]
const LIGHT = { dark: 0, baseColor: [1, 0.99, 0.97] as Rgb, glowColor: [0.96, 0.94, 0.91] as Rgb, mapBrightness: 7 }
const NIGHT = { dark: 1, baseColor: [0.32, 0.29, 0.27] as Rgb, glowColor: [0.1, 0.09, 0.08] as Rgb, mapBrightness: 5 }

const HOME_LAT = 50.45
const HOME_LON = 30.52
/** One slow turn takes about a minute; the globe is not touch-controlled. */
const SPIN_RAD_PER_SEC = 0.1

/** Camera angles that put a place at the centre of cobe's view (calibrated against its marker projection). */
export function focus(lat: number, lon: number) {
  const rad = Math.PI / 180
  return { phi: -lon * rad - Math.PI / 2, theta: lat * rad }
}

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches
const anchorSupported = () => typeof CSS !== "undefined" && CSS.supports("anchor-name", "--a")

export function mountGlobe(host: HTMLElement, initial: Pin[]): GlobeView {
  const canvas = document.createElement("canvas")
  canvas.className = "globe-canvas"
  host.append(canvas)

  const home = focus(HOME_LAT, HOME_LON)
  let phi = home.phi
  const theta = home.theta
  let pins = initial
  let signature = JSON.stringify(initial)
  let spinning = true
  let dirty = true
  let onScreen = true
  let raf = 0
  let last = 0
  let globe: ReturnType<typeof createGlobe> | null = null
  let layer: HTMLElement | null = null
  const labels = new Map<string, { el: HTMLElement; name: HTMLElement; time: HTMLElement }>()
  const dark = matchMedia("(prefers-color-scheme: dark)")

  const markers = () =>
    pins.map((p) => ({ id: p.id, location: [p.lat, p.lon] as [number, number], size: p.home ? 0.05 : 0.04, color: CORAL }))

  const running = () => onScreen && !document.hidden
  const turning = () => spinning && !reducedMotion()

  function frame(now: number) {
    raf = 0
    if (!globe || !running()) return
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0
    last = now
    if (turning()) {
      phi += SPIN_RAD_PER_SEC * dt
      dirty = true
    }
    if (dirty) {
      dirty = false
      globe.update({ phi, theta, markers: markers(), ...(dark.matches ? NIGHT : LIGHT) })
    }
    if (turning()) schedule()
  }

  /** Draws every frame only while turning and visible; otherwise just once per change. */
  function schedule() {
    if (!raf && globe && running()) raf = requestAnimationFrame(frame)
  }

  function invalidate() {
    dirty = true
    last = 0
    schedule()
  }

  function renderLabels() {
    if (!anchorSupported()) return
    const keep = new Set<string>()
    for (const p of pins) {
      keep.add(p.id)
      let l = labels.get(p.id)
      if (!l) {
        const el = document.createElement("div")
        el.className = "pin"
        el.style.setProperty("position-anchor", `--cobe-${p.id}`)
        const name = document.createElement("span")
        const time = document.createElement("b")
        el.append(name, " ", time)
        layer!.append(el)
        l = { el, name, time }
        labels.set(p.id, l)
      }
      l.el.classList.toggle("home", !!p.home)
      l.name.textContent = p.name
      l.time.textContent = p.time
    }
    for (const [id, l] of labels) {
      if (!keep.has(id)) {
        l.el.remove()
        labels.delete(id)
      }
    }
  }

  function init() {
    const size = canvas.offsetWidth
    if (size === 0 || globe) return
    const t = dark.matches ? NIGHT : LIGHT
    globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: size,
      height: size,
      phi,
      theta,
      mapSamples: 16000,
      diffuse: 1.4,
      markerColor: CORAL,
      markerElevation: 0.01,
      markers: markers(),
      opacity: 0.9,
      ...t,
    })
    // Labels must come after cobe's anchor elements in tree order, or CSS anchor lookup fails for
    // anchors created later. Cobe's wrapper holds the anchors; this layer is its later sibling.
    layer = document.createElement("div")
    host.append(layer)
    renderLabels()
    canvas.style.opacity = "1"
    invalidate()
  }

  const resizeObs = new ResizeObserver(() => {
    if (!globe) init()
  })
  resizeObs.observe(canvas)

  const visObs = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting
    if (onScreen) invalidate()
  })
  visObs.observe(host)

  const onVisibility = () => !document.hidden && invalidate()
  document.addEventListener("visibilitychange", onVisibility)
  dark.addEventListener("change", invalidate)

  return {
    setSpinning(on) {
      if (on === spinning) return
      spinning = on
      if (on) invalidate()
    },
    setPins(next) {
      const sig = JSON.stringify(next)
      if (sig === signature) return
      signature = sig
      pins = next
      if (globe) {
        renderLabels()
        invalidate()
      }
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf)
      resizeObs.disconnect()
      visObs.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      dark.removeEventListener("change", invalidate)
      globe?.destroy()
      globe = null
      labels.clear()
      host.replaceChildren()
    },
  }
}
