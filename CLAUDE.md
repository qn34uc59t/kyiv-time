# Kyiv Time — worker time zone tracker

Scheduling happens in Kyiv time (Europe/Kyiv). Workers are worldwide. This tool shows Kyiv time against up to 4 other cities, live, with a scrubber to pick a Kyiv time and see everyone's local equivalent. Installable PWA, hosted statically (GitHub Pages or any domain). No backend.

## Stack
- Vanilla TypeScript + Vite. No UI framework.
- `cobe` (MIT) for the globe. Base is the 21st.dev component saved in `globe.txt` (React), ported to a vanilla TS module. It has no built-in demo markers/cities: markers and arcs are props, so we pass only Kyiv + the user's cities. We drop arcs, React and the unused props.
- Keep from it: DPR cap of 2, markers with `id`, labels via cobe's `--cobe-<id>` anchor names and `--cobe-visible-<id>` vars.
- Change in the port: auto-spin only (no drag); start aimed at Ukraine; create the globe once and call `update()` when cities change (the original rebuilds it on every markers change); restyle labels to our design rules; without CSS Anchor Positioning, markers show but badges don't.
- `vite-plugin-pwa` for manifest + service worker (offline, installable).
- Time math: native `Intl.DateTimeFormat` with IANA zones only. No moment/luxon/date-fns-tz.
- Relative `base` in Vite config so it works under a GitHub Pages subpath or a custom domain.

## Product rules
- Kyiv is always present, pinned first, and cannot be removed.
- Max 4 additional cities. Disable adding at 4 and say why.
- City picker: one search box over a bundled city list (name, country, IANA zone, lat/lon). Show country next to each result.
- **Excluded countries (never in the list, never reachable via URL/localStorage): Russia (RU), Belarus (BY), Iran (IR), North Korea (KP), Afghanistan (AF).** Filter at data build time AND when reading saved/shared state.
- Scrubber: shifts the reference Kyiv time (default = now, live). A "Now" control returns to live. All rows update from that one value.
- Each row: city, country, local time, day offset vs Kyiv (e.g. "+1 day"), UTC offset difference ("−10h"). DST must be correct for the scrubbed date, not just today.
- State persists in localStorage and mirrors into the URL (`?c=lisbon,tokyo`) so a link preloads a worker's zones. Validate and drop unknown or excluded ids.

## Globe (optional "Globe" switch, on by default for first-time visitors, saved + always in the URL as `g=1`/`g=0`)
- Lives in `src/globe.ts`; the whole feature is removable by deleting that file, the switch and `syncGlobe` in `main.ts`.
- Created only while the switch is on and destroyed when it's off (frees WebGL). Renders on demand: draws only while on screen and the tab is visible.
- Starts aimed at Kyiv. Calibrated for cobe 2.0.1: `phi = -lon - 90°`, `theta = lat`.
- Badges never fade, dim or hide, even when their city is on the far side of the globe.
- Kyiv badge is always present (coral, above its marker). Each tracked city adds a badge below its marker, with local time that follows the scrubber.
- Badges use cobe's CSS anchor names; browsers without CSS Anchor Positioning get markers but no badges.
- The globe turns slowly on its own and is NOT touch/mouse controlled (dragging fought page scrolling on phones). `prefers-reduced-motion` keeps it still. It also stops while a planned time is set (Planning mode) and resumes from the same spot on "Back to live".

## Design rules (strict)
- Two colours only: coral (accent) and warm ink/off-white (neutral). Coral is something like #F26B5B, not default red. Light and dark themes, follows system.
- NO: purple/blue gradients, drop shadows, divider lines between everything, colourful icons, hover animations on static things, card-in-card wrappers, decorative placeholders.
- Separate things with spacing and type scale, not borders or boxes. Few DOM wrappers.
- Motion only where something actually changes (globe rotation, a row entering/leaving). Nothing else moves.
- Changes resolve out of a blur (about 8px to 0, 0.3-0.45s, ease `cubic-bezier(0.4,0,0.2,1)`): rows entering/leaving, the picker, the picked-time strip, and all clocks on the 12-hour flip. Never blur anything under a dragging finger (slider, drag grip). Everything is off for `prefers-reduced-motion`.
- Typography does the work: one good sans, tabular numerals for times.
- Icons: minimal single-colour line glyphs, only where text can't do it.

- Wordmark: `assets/kyivtime-logo.svg` is the source; the page header inlines it with `fill="currentColor"` so it follows light/dark. It is used only as the wordmark, not as an icon.

## Mobile first
Every decision answers: "is this good on a phone?"
- Design at 375px first; scale up.
- Touch targets ≥ 44px. Scrubber is thumb-friendly, bottom-reachable.
- Respect safe-area insets; `viewport-fit=cover`; no horizontal scroll.
- Inputs ≥16px font so iOS doesn't zoom. Picker opens as a bottom sheet on mobile.
- Don't let the globe capture page scroll: use `touch-action` carefully.
- Test installed-PWA mode (standalone), offline, and landscape.

## Code conventions
- Strict TS, small modules: `time.ts` (conversion/format), `cities.ts` (data + exclusion), `state.ts` (store + URL + storage), `globe.ts`, `ui/*`.
- Pure functions for time math; unit-test them with Vitest (DST edges, day offsets, half-hour zones like India/Nepal, exclusion filter).
- Keep dependencies minimal; justify any new one.
- Deploy: GitHub Actions to Pages, `npm run build` → `dist`.

## PWA and deploy
- `vite-plugin-pwa` generates the manifest and service worker (auto-update, precaches the app, Latin fonts and the globe chunk; works offline). Icon source is `assets/logo.svg` (a square K mark with a coral dot; not shipped); `node scripts/build-icons.mjs` renders app, maskable, iOS and favicon PNGs into `public/icons/`.
- The globe chunk is lazy-loaded the first time the switch is turned on.
- GeoNames credit (CC BY 4.0): the in-page info icon (name, email, credit) is currently hidden by the owner's choice (`hidden` on `#info` in `index.html`). The credit is in the README.
- Deploy: `.github/workflows/deploy.yml` publishes `dist/` to GitHub Pages on push to `main`. Any static host works; HTTPS is required for install and offline.

## Commands
- `npm run dev` · `npm run build` · `npm run preview` · `npm test`
- `node scripts/build-cities.mjs <cities15000.txt>` · `node scripts/build-icons.mjs`
