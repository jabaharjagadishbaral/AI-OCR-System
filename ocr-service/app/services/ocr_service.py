"""
Level 1: core OCR extraction.

Converts an uploaded PDF or image into per-page text using Tesseract.
This is the one piece of the pipeline that's fully wired up end-to-end;
everything in services/ beyond this is a documented stub so you can build
out Levels 2-4 incrementally without restructuring the app.

Stateless: returns an OCRResult, doesn't assign an ID or persist anything.
The Node/Express layer (server/) is responsible for storage.
"""
from pathlib import Path

import pytesseract
from PIL import Image

from app.config import OCR_LANGUAGES
from app.models.schemas import OCRResult, OCRPage
from app.services.image_processing import preprocess_image


def _load_pages(filepath: Path) -> list[Image.Image]:
    """Return a list of PIL images, one per page. Handles PDFs and single images."""
    if filepath.suffix.lower() == ".pdf":
        from pdf2image import convert_from_path
        return convert_from_path(str(filepath), dpi=300)
    return [Image.open(filepath)]


def extract_text(filepath: Path, filename: str) -> OCRResult:
    pages_raw = _load_pages(filepath)
    pages: list[OCRPage] = []
    full_text_parts = []

    for i, page_img in enumerate(pages_raw, start=1):
        # Level 2 hook: image_processing.preprocess_image handles rotation
        # correction / noise removal / contrast enhancement before OCR.
        cleaned = preprocess_image(page_img)

        data = pytesseract.image_to_data(
            cleaned, lang=OCR_LANGUAGES, output_type=pytesseract.Output.DICT
        )
        words = [w for w in data["text"] if w.strip()]
        confidences = [int(c) for c, w in zip(data["conf"], data["text"]) if w.strip() and c != "-1"]
        avg_conf = sum(confidences) / len(confidences) if confidences else None

        text = pytesseract.image_to_string(cleaned, lang=OCR_LANGUAGES)
        full_text_parts.append(text)

        pages.append(OCRPage(
            page_number=i,
            text=text,
            confidence=avg_conf,
            width=cleaned.width,
            height=cleaned.height,
        ))

    return OCRResult(
        filename=filename,
        page_count=len(pages),
        pages=pages,
        full_text="\n\n".join(full_text_parts),
    )
