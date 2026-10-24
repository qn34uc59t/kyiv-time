import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  base: "./",
  test: { environment: "node" },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png", "icons/favicon-16.png", "icons/favicon-32.png", "icons/favicon-48.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // The UI is Latin-only, so skip precaching the other font subsets.
        globIgnores: ["**/*cyrillic*", "**/*greek*", "**/*vietnamese*", "og.png"],
        // Walkthrough clips stay out of the install precache; each is kept for offline the first time it's watched.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/clips/"),
            handler: "CacheFirst",
            options: { cacheName: "clips", expiration: { maxEntries: 20 } },
          },
        ],
      },
      manifest: {
        name: "Kyiv Time",
        short_name: "Kyiv Time",
        description: "Track Kyiv time against your team's local times.",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#f6f2ec",
        theme_color: "#f6f2ec",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
})
