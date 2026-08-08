# Lumen — AI-Integrated MERN Document Intelligence

Upload a PDF/image, get OCR text, then use a local Ollama model to summarize,
classify, translate, or answer questions about it. Every scan is stored in MongoDB.

## Architecture

```
frontend/     React + Vite — talks ONLY to the Express server
server/       Node.js + Express + MongoDB (Mongoose)  <-- the app's brain
                - owns document identity & persistence (MongoDB)
                - proxies OCR + AI calls to ocr-service
                - generates JSON/CSV/XLSX exports itself
ocr-service/  Python + FastAPI, served by Hypercorn (NOT uvicorn)
                - stateless: Tesseract OCR extraction
                - AI features via a local Ollama model (no API key)
```

The frontend never talks to Python directly. Express is the single
gateway; the FastAPI service is an internal microservice Express calls
over HTTP, the same way it would call any other backing service.

Why hybrid instead of pure MERN: OCR (Tesseract/OpenCV/pdf2image) is a
Python-native toolchain with no equivalent-quality Node library, so it
stays in its own FastAPI service — everything else (identity, storage,
history, exports, request orchestration) is genuine MERN.

## Running it locally

You need three processes running at once, plus MongoDB.

### 1. MongoDB
Run a local `mongod`, or point `MONGODB_URI` (see below) at MongoDB Atlas
or any hosted instance.

### 2. ocr-service (Python / FastAPI / Hypercorn)
```bash
cd ocr-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# System dependency for OCR:
#   sudo apt install tesseract-ocr poppler-utils

# AI dependency (local, free, no API key):
#   install Ollama -> https://ollama.com
#   ollama pull llama3.2
#   ollama serve                 # usually auto-starts after install

cp .env.example .env
python run.py                # runs on Hypercorn, http://localhost:8001
```

### 3. server (Node / Express / MongoDB)
```bash
cd server
npm install
cp .env.example .env        # set MONGODB_URI, OCR_SERVICE_URL
npm run dev                  # http://localhost:5000
```

### 4. frontend (React / Vite)
```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

Open http://localhost:5173 — Vite proxies `/api` to Express, Express
proxies OCR/AI calls to the Python service.

## Environment variables

**ocr-service/.env**
| Var | Purpose |
|---|---|
| `OLLAMA_HOST` | Where Ollama is running, default `http://localhost:11434` |
| `OLLAMA_MODEL` | Defaults to `llama3.2` -- pull it first with `ollama pull llama3.2` |
| `OCR_LANGUAGES` | Tesseract language packs, default `eng` |
| `PORT` | Default `8001` |

**server/.env**
| Var | Purpose |
|---|---|
| `MONGODB_URI` | Mongo connection string |
| `OCR_SERVICE_URL` | Where Express finds the Python service |
| `CLIENT_ORIGIN` | CORS allow-list for the frontend, default `http://localhost:5173` |
| `PORT` | Default `5000` |

## API (via Express, port 5000)

- `POST /api/documents/upload` — multipart file → OCR + stores in Mongo
- `GET /api/documents` — scan history
- `GET /api/documents/:id` — one document
- `DELETE /api/documents/:id`
- `GET /api/documents/:id/export/:fmt` — `json` | `csv` | `xlsx`
- `POST /api/documents/:id/summarize`
- `POST /api/documents/:id/classify`
- `POST /api/documents/:id/ask` — body `{ question }`
- `POST /api/documents/:id/translate` — body `{ target_language }`

## What's next (unchanged from the original starter)
Table extraction, form/key-value extraction, and signature/stamp/QR
detection are still open extension points — see the docstrings that were
in the original `layout_service.py` for the recommended libraries
(table-transformer, LayoutLMv3, YOLOv11, pyzbar) if you want to add them
back into `ocr-service/app/services/`.
