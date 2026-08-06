from typing import Optional
from pydantic import BaseModel


class OCRPage(BaseModel):
    page_number: int
    text: str
    confidence: Optional[float] = None
    width: int
    height: int


class OCRResult(BaseModel):
    """
    What this microservice hands back for a single upload. Stateless by
    design -- no document_id, no timestamps, no persistence. The Node/
    Express layer owns identity and storage (MongoDB) for the document.
    """
    filename: str
    page_count: int
    pages: list[OCRPage]
    full_text: str


class SummarizeRequest(BaseModel):
    text: str


class SummarizeResponse(BaseModel):
    summary: str


class AskRequest(BaseModel):
    text: str
    question: str


class AskResponse(BaseModel):
    answer: str


class ClassifyRequest(BaseModel):
    text: str


class ClassifyResponse(BaseModel):
    document_type: str


class TranslateRequest(BaseModel):
    text: str
    target_language: str


class TranslateResponse(BaseModel):
    translated_text: str
