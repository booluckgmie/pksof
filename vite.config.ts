import path from "path";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Prokhas Performance Dashboard",
        short_name: "Prokhas",
        description: "Group Performance Dashboard for Prokhas Sdn Bhd — Corporate Performance, Financial Health and Resource & People KPIs.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#f4ede0",
        theme_color: "#0B2159",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precache the app shell only — this dashboard's KPI figures come from Supabase and
        // must never be served stale from cache, so runtime data requests are left alone
        // (no runtimeCaching entries) and always hit the network.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
