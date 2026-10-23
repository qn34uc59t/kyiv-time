// Renders every app icon from assets/logo.svg. Run: node scripts/build-icons.mjs
import sharp from "sharp"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const BG = "#edebe9" // the logo's own background, so padded versions blend seamlessly
const svg = readFileSync(fileURLToPath(new URL("../assets/logo.svg", import.meta.url)), "utf8")
const out = (name) => fileURLToPath(new URL(`../public/icons/${name}`, import.meta.url))
const png = { palette: true, quality: 92, effort: 10, compressionLevel: 9 }

/** The logo rendered crisply at `size` px square. */
const render = (size) =>
  sharp(Buffer.from(svg.replace('width="100%" height="100%"', `width="${size}" height="${size}"`)), { density: 300 })
    .resize(size, size)
    .png()
    .toBuffer()

/** The logo shrunk to `scale` of a `size` canvas, so it stays inside the safe zone of masked icons. */
async function padded(size, scale) {
  const inner = Math.round(size * scale)
  const offset = Math.round((size - inner) / 2)
  return sharp({ create: { width: size, height: size, channels: 3, background: BG } })
    .composite([{ input: await render(inner), left: offset, top: offset }])
    .png()
    .toBuffer()
}

for (const size of [192, 512]) await sharp(await render(size)).png(png).toFile(out(`icon-${size}.png`))

// Maskable (Android circle/squircle crops) and iOS touch icons: full-bleed with the mark pulled in.
await sharp(await padded(512, 0.8)).png(png).toFile(out("maskable-512.png"))
await sharp(await padded(180, 0.9)).png(png).toFile(out("apple-touch-icon.png"))

// Favicons are tiny, so crop the empty margin first (the mark spans roughly x 13-56, y 10-51 of 62).
const big = await render(620)
for (const size of [16, 32, 48]) {
  await sharp(big).extract({ left: 60, top: 40, width: 500, height: 500 }).resize(size, size).png(png).toFile(out(`favicon-${size}.png`))
}
console.log("icons written")
