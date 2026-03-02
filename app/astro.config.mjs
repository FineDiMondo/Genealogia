import { defineConfig } from "astro/config";
import AstroPWA from "@vite-pwa/astro";

export default defineConfig({
  output: "static",
  outDir: "./dist",
  base: "/Genealogia/",
  integrations: [
    AstroPWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "Portale Giardina",
        short_name: "Giardina",
        start_url: "/Genealogia/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1f2937",
        icons: [
          {
            src: "/Genealogia/pwa-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/Genealogia/pwa-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
