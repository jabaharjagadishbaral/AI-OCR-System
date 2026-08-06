from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.config import UPLOAD_DIR, ALLOWED_EXTENSIONS, MAX_UPLOAD_MB
from app.models.schemas import OCRResult
from app.services.ocr_service import extract_text

router = APIRouter(prefix="/api/ocr", tags=["ocr"])


@router.post("/extract", response_model=OCRResult)
async def extract(file: UploadFile = File(...)):
    """
    Runs Tesseract OCR over an uploaded PDF/image and returns the raw
    result. Stateless -- nothing is kept here after the response is sent.
    The Express server is what assigns a document_id and saves this to
    MongoDB.
    """
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(400, f"File exceeds {MAX_UPLOAD_MB}MB limit")

    saved_path = UPLOAD_DIR / f"{uuid4()}{ext}"
    saved_path.write_bytes(contents)

    try:
        return extract_text(saved_path, filename=file.filename)
    finally:
        saved_path.unlink(missing_ok=True)
