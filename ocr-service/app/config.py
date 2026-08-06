"""
Central configuration for the OCR/AI microservice.

This service is intentionally stateless -- it takes a file in, hands OCR
text (and, optionally, AI-derived fields) back out. Persistence lives in
the Node/Express + MongoDB layer (see /server), not here.

Reads from environment variables (see .env.example) so the same code runs
locally, in Docker, and in production without edits.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Scratch space for uploaded files while they're being OCR'd. Cleaned up
# after processing -- the Node layer is the system of record for results.
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", BASE_DIR / "storage" / "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Tesseract language packs to try during OCR (Level 2: multi-language OCR).
# Install extra packs with e.g. `apt install tesseract-ocr-hin tesseract-ocr-fra`
OCR_LANGUAGES = os.getenv("OCR_LANGUAGES", "eng")

MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "25"))
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}

# Local Ollama server -- powers summarize / ask / classify / translate in
# services/llm_service.py. No API key needed. Install: https://ollama.com
# Then: `ollama pull llama3.2` and `ollama serve` (usually auto-started).
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

# Origins allowed to call this service directly. In this architecture only
# the Express server (server/) should call it, but CORS is left open to a
# configurable list in case you want to hit it directly during development.
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5000,http://localhost:5173"
).split(",")
