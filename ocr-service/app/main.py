from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import ALLOWED_ORIGINS
from app.routers import documents, intelligence

app = FastAPI(
    title="Lumen OCR & AI Microservice",
    version="0.2.0",
    description="Stateless OCR extraction (Tesseract) + AI understanding (local Ollama model). "
                 "Called internally by the Node/Express layer -- see /server. "
                 "Runs on Hypercorn, not uvicorn.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(intelligence.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ocr-service"}
