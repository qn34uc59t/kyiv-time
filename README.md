# Kyiv Time

Scheduling happens in Kyiv time; your team is everywhere. Track Kyiv against up to 4 cities, scrub Kyiv time to plan a call, and install it on a phone as an app. No backend.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # outputs dist/
```

## Deploy

**GitHub Pages:** push to `main`, then in the repo go to Settings → Pages → Source: GitHub Actions. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes `dist/`.

**Any other host:** upload the contents of `dist/`. Paths are relative, so it works at a domain root or under a subpath. It must be served over HTTPS for install and offline to work.

## Regenerating data and icons

- Cities: `node scripts/build-cities.mjs path/to/cities15000.txt` (GeoNames, CC BY 4.0). Russia, Belarus, Iran, North Korea and Afghanistan are dropped here and again at runtime.
- App icon and favicons: replace `assets/logo.svg` (square), then `node scripts/build-icons.mjs`. The header wordmark is `assets/kyivtime-logo.svg`, inlined in `index.html`.

## Credits

- City data: [GeoNames](https://www.geonames.org/), CC BY 4.0.
- Globe: [cobe](https://github.com/shuding/cobe) by Shu Ding (MIT), adapted from the cobe-globe component on 21st.dev.
- Typeface: Inter, via [Fontsource](https://fontsource.org/) (SIL OFL 1.1).

