import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All /api calls go to the Express server (MongoDB + orchestration).
      // Express is the only thing that talks to the Python ocr-service.
      "/api": "http://localhost:5000",
    },
  },
});
