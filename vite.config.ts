import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resultsHandler } from "./server/handler.ts";
import { regionsHandler } from "./server/regions-handler.ts";
import path from "node:path";
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "official-results",
      configureServer(server) {
        server.middlewares.use("/api/results", resultsHandler);
        server.middlewares.use("/api/regions", regionsHandler);
      },
    },
  ],
  resolve: { alias: { "@": path.resolve("src") } },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "motion",
              test: /node_modules[\\/](?:motion|motion-dom|motion-utils|framer-motion)[\\/]/,
            },
          ],
        },
      },
    },
  },
});
