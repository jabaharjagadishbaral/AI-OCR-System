import axios from "axios";
import FormData from "form-data";

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || "http://localhost:8001";

const client = axios.create({ baseURL: OCR_SERVICE_URL, timeout: 120_000 });

/**
 * Sends a file buffer to the Python OCR microservice and returns the raw
 * extraction result (filename, page_count, pages[], full_text).
 */
export async function extractText(buffer, filename) {
  const form = new FormData();
  form.append("file", buffer, filename);

  const { data } = await client.post("/api/ocr/extract", form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return data;
}

export async function aiSummarize(text) {
  const { data } = await client.post("/api/ai/summarize", { text });
  return data.summary;
}

export async function aiAsk(text, question) {
  const { data } = await client.post("/api/ai/ask", { text, question });
  return data.answer;
}

export async function aiClassify(text) {
  const { data } = await client.post("/api/ai/classify", { text });
  return data.document_type;
}

export async function aiTranslate(text, targetLanguage) {
  const { data } = await client.post("/api/ai/translate", {
    text,
    target_language: targetLanguage,
  });
  return data.translated_text;
}

export async function ocrServiceHealthy() {
  try {
    const { data } = await client.get("/api/health", { timeout: 3000 });
    return data.status === "ok";
  } catch {
    return false;
  }
}
