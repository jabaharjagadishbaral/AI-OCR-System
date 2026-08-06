import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { connectDB } from "./config/db.js";
import documentsRouter from "./routes/documents.js";
import { ocrServiceHealthy } from "./services/ocrClient.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/api/health", async (req, res) => {
  const ocrUp = await ocrServiceHealthy();
  res.json({ status: "ok", service: "lumen-server", ocr_service: ocrUp ? "ok" : "unreachable" });
});

app.use("/api/documents", documentsRouter);

// Fallback 404 for unknown /api routes
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large" || err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File exceeds the upload size limit" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] Lumen Express API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
