import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset: "vercel",
      routeRules: {
        '/api/**': { proxy: 'https://200.97.165.54.nip.io/api/**' }
      }
    }),
    viteReact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Battery Mantra',
        short_name: 'BatteryMantra',
        description: 'India\'s #1 Battery & Inverter Store',
        theme_color: '#dc2626',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'https://200.97.165.54.nip.io',
        changeOrigin: true,
        secure: false,
      }
    }
  },
});
