import { MAX_EXTRA, reorder, sanitizeIds } from "./cities"

const STORAGE_KEY = "kyiv-time:v1"

export interface State {
  ids: string[]
  hour12: boolean
  globe: boolean
}

type Listener = (s: State) => void
const listeners = new Set<Listener>()

function readStorage(): Partial<State> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
  } catch {
    return {}
  }
}

function load(): State {
  const stored = readStorage()
  const q = new URLSearchParams(location.search)
  const fromUrl = q.has("c") ? q.get("c")!.split(",").filter(Boolean) : null
  return {
    ids: sanitizeIds(fromUrl ?? stored.ids),
    hour12: q.has("h") ? q.get("h") === "12" : stored.hour12 ?? true,
    globe: q.has("g") ? q.get("g") === "1" : stored.globe ?? true,
  }
}

let state = load()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable (private mode): the URL still carries the state */
  }
  const q = new URLSearchParams()
  if (state.ids.length) q.set("c", state.ids.join(","))
  // Always written, so a shared link reproduces the sender's view despite the on-by-default switches.
  q.set("h", state.hour12 ? "12" : "24")
  q.set("g", state.globe ? "1" : "0")
  const qs = q.toString()
  history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""))
}

function set(next: State) {
  state = next
  persist()
  listeners.forEach((l) => l(state))
}

export const getState = () => state

export function subscribe(l: Listener) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function addCity(id: string) {
  if (state.ids.length >= MAX_EXTRA) return
  const ids = sanitizeIds([...state.ids, id])
  if (ids.length !== state.ids.length) set({ ...state, ids })
}

export function moveCity(from: number, to: number) {
  const ids = reorder(state.ids, from, to)
  if (ids !== state.ids) set({ ...state, ids })
}

export function replaceCity(oldId: string, newId: string) {
  const i = state.ids.indexOf(oldId)
  if (i === -1 || state.ids.includes(newId)) return
  const next = state.ids.slice()
  next[i] = newId
  const ids = sanitizeIds(next)
  if (ids.length === next.length) set({ ...state, ids })
}

export const removeCity = (id: string) => set({ ...state, ids: state.ids.filter((x) => x !== id) })

export const setHour12 = (hour12: boolean) => set({ ...state, hour12 })

export const setGlobe = (globe: boolean) => set({ ...state, globe })

persist()
