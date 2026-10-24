// node scripts/clips/run.mjs [name ...]   (dev server must be running; set CLIP_ORIGIN if it isn't on :5174)
import { mkdirSync } from "node:fs"

const all = ["android", "ios", "desktop", "pin"]
const names = process.argv.slice(2).length ? process.argv.slice(2) : all
mkdirSync("public/clips", { recursive: true })
for (const name of names) {
  const { default: record } = await import(`./${name}.mjs`)
  console.log("recording", name)
  await record(`public/clips/${name}.mp4`)
}
