import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true, // Allow all network & tunnel hosts (localtunnel, cloudflare, mobile IP)
    proxy: {
      "/api": "http://localhost:5001",
    },
  },
});
