# Kyiv Time

**Open it: https://qn34uc59t.github.io/kyiv-time/**

Scheduling happens in Kyiv time; your team is everywhere. Track Kyiv against up to 4 cities, scrub Kyiv time to plan a call, and add it to your phone's home screen as an app. Nothing to install and no account.

- Search a city, and each row shows its local time, how far it is from Kyiv, and whether it's today or tomorrow there.
- Drag the slider to plan: pick a Kyiv time and every city updates, daylight saving included.
- Share a link and your cities come with it.
- Optional rotating globe, 12-hour or 24-hour clock, light and dark mode, works offline.
- Tap the ? for a short how-to on adding it to your home screen (Android, iPhone, desktop) or pinning the tab.

## Credits

- City data: [GeoNames](https://www.geonames.org/), CC BY 4.0.
- Globe: [cobe](https://github.com/shuding/cobe) by Shu Ding (MIT), adapted from the cobe-globe component on 21st.dev.
- Typeface: Inter, via [Fontsource](https://fontsource.org/) (SIL OFL 1.1).

---

## For developers

Only needed if you want to change the code. Using the app needs none of this.

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # outputs dist/
```

### Deploy

**GitHub Pages:** pushes to `main` publish automatically through `.github/workflows/deploy.yml` (Settings → Pages → Source: GitHub Actions).

**Any other host:** upload the contents of `dist/`. Paths are relative, so it works at a domain root or under a subpath. It must be served over HTTPS for install and offline to work.

### Regenerating data and icons

- Cities: `node scripts/build-cities.mjs path/to/cities15000.txt` (GeoNames). Russia, Belarus, Iran, North Korea and Afghanistan are dropped here and again at runtime.
- App icon and favicons: replace `assets/logo.svg` (square), then `node scripts/build-icons.mjs`. The header wordmark is `assets/kyivtime-logo.svg`, inlined in `index.html`.
- Install how-to clips: `public/clips/` is generated, not hand-recorded. With `npm run dev` running, `CLIP_ORIGIN=http://localhost:5173 node scripts/clips/run.mjs [android|ios|desktop|pin]` re-records them (needs Chrome installed).
