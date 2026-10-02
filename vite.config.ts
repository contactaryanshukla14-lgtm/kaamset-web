import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/v1": {
        target:
          process.env.KAAMSET_LOCAL_API_URL ||
          "https://foundation-production-api-production.up.railway.app",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("proxyReq", (request) => request.removeHeader("origin"));
        },
      },
    },
  },
});
