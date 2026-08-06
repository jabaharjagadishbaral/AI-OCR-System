import { Router } from "express";
import { v4 as uuidv4 } from "uuid";

import upload from "../middleware/upload.js";
import DocumentModel from "../models/Document.js";
import {
  extractText,
  aiSummarize,
  aiAsk,
  aiClassify,
  aiTranslate,
} from "../services/ocrClient.js";
import { toJSON, toCSV, toXLSX } from "../services/exportService.js";

const router = Router();

const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"]);

function relayOcrServiceError(res, err, fallbackMessage) {
  if (err.response) {
    const detail = err.response.data?.detail || fallbackMessage;
    return res.status(err.response.status).json({ error: detail });
  }
  if (err.code === "ECONNREFUSED") {
    return res
      .status(503)
      .json({ error: "OCR/AI service is unreachable. Is ocr-service running?" });
  }
  return res.status(500).json({ error: fallbackMessage });
}

// POST /api/documents/upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const ext = "." + req.file.originalname.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return res.status(400).json({
        error: `Unsupported file type '${ext}'. Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}`,
      });
    }

    const ocrResult = await extractText(req.file.buffer, req.file.originalname);

    const doc = await DocumentModel.create({
      document_id: uuidv4(),
      filename: ocrResult.filename,
      page_count: ocrResult.page_count,
      pages: ocrResult.pages,
      full_text: ocrResult.full_text,
    });

    res.status(201).json(doc);
  } catch (err) {
    relayOcrServiceError(res, err, "OCR extraction failed");
  }
});

// GET /api/documents  (history, newest first)
router.get("/", async (req, res) => {
  const docs = await DocumentModel.find({}, {
    document_id: 1,
    filename: 1,
    page_count: 1,
    document_type: 1,
    created_at: 1,
  }).sort({ created_at: -1 }).limit(50);
  res.json(docs);
});

// GET /api/documents/:id
router.get("/:id", async (req, res) => {
  const doc = await DocumentModel.findOne({ document_id: req.params.id });
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
});

// DELETE /api/documents/:id
router.delete("/:id", async (req, res) => {
  const result = await DocumentModel.deleteOne({ document_id: req.params.id });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Document not found" });
  res.status(204).end();
});

// GET /api/documents/:id/export/:fmt
router.get("/:id/export/:fmt", async (req, res) => {
  const doc = await DocumentModel.findOne({ document_id: req.params.id });
  if (!doc) return res.status(404).json({ error: "Document not found" });

  const plain = doc.toObject();
  const { fmt } = req.params;

  try {
    if (fmt === "json") {
      res.set("Content-Type", "application/json");
      res.set("Content-Disposition", `attachment; filename="${doc.document_id}.json"`);
      return res.send(toJSON(plain));
    }
    if (fmt === "csv") {
      res.set("Content-Type", "text/csv");
      res.set("Content-Disposition", `attachment; filename="${doc.document_id}.csv"`);
      return res.send(toCSV(plain));
    }
    if (fmt === "xlsx") {
      const buffer = await toXLSX(plain);
      res.set(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.set("Content-Disposition", `attachment; filename="${doc.document_id}.xlsx"`);
      return res.send(buffer);
    }
    return res.status(400).json({ error: `Unknown export format '${fmt}'. Use json, csv, or xlsx.` });
  } catch (err) {
    res.status(500).json({ error: "Export generation failed" });
  }
});

// ---- AI-integrated endpoints (proxy to the FastAPI/Ollama microservice, cache result in Mongo) ----

// POST /api/documents/:id/summarize
router.post("/:id/summarize", async (req, res) => {
  try {
    const doc = await DocumentModel.findOne({ document_id: req.params.id });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const summary = await aiSummarize(doc.full_text);
    doc.summary = summary;
    await doc.save();
    res.json({ summary });
  } catch (err) {
    relayOcrServiceError(res, err, "Summarization failed");
  }
});

// POST /api/documents/:id/ask   body: { question }
router.post("/:id/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "question is required" });

    const doc = await DocumentModel.findOne({ document_id: req.params.id });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const answer = await aiAsk(doc.full_text, question);
    doc.qa_history.push({ question, answer });
    await doc.save();
    res.json({ answer });
  } catch (err) {
    relayOcrServiceError(res, err, "Question answering failed");
  }
});

// POST /api/documents/:id/classify
router.post("/:id/classify", async (req, res) => {
  try {
    const doc = await DocumentModel.findOne({ document_id: req.params.id });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const documentType = await aiClassify(doc.full_text);
    doc.document_type = documentType;
    await doc.save();
    res.json({ document_type: documentType });
  } catch (err) {
    relayOcrServiceError(res, err, "Classification failed");
  }
});

// POST /api/documents/:id/translate   body: { target_language }
router.post("/:id/translate", async (req, res) => {
  try {
    const { target_language: targetLanguage } = req.body;
    if (!targetLanguage) return res.status(400).json({ error: "target_language is required" });

    const doc = await DocumentModel.findOne({ document_id: req.params.id });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const translatedText = await aiTranslate(doc.full_text, targetLanguage);
    doc.translations.set(targetLanguage, translatedText);
    await doc.save();
    res.json({ translated_text: translatedText });
  } catch (err) {
    relayOcrServiceError(res, err, "Translation failed");
  }
});

export default router;
