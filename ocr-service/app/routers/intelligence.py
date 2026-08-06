"""
AI endpoints, backed by services/llm_service.py (local Ollama model).
Stateless -- the caller (the Express server) sends the document text it
already has stored in MongoDB; this service never looks documents up by
ID, because it doesn't store any.
"""
from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    SummarizeRequest, SummarizeResponse,
    AskRequest, AskResponse,
    ClassifyRequest, ClassifyResponse,
    TranslateRequest, TranslateResponse,
)
from app.services import llm_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(payload: SummarizeRequest):
    try:
        return SummarizeResponse(summary=llm_service.summarize(payload.text))
    except RuntimeError as e:
        raise HTTPException(503, str(e))


@router.post("/ask", response_model=AskResponse)
async def ask(payload: AskRequest):
    try:
        return AskResponse(answer=llm_service.answer_question(payload.text, payload.question))
    except RuntimeError as e:
        raise HTTPException(503, str(e))


@router.post("/classify", response_model=ClassifyResponse)
async def classify(payload: ClassifyRequest):
    try:
        return ClassifyResponse(document_type=llm_service.classify_document(payload.text))
    except RuntimeError as e:
        raise HTTPException(503, str(e))


@router.post("/translate", response_model=TranslateResponse)
async def translate(payload: TranslateRequest):
    try:
        return TranslateResponse(
            translated_text=llm_service.translate(payload.text, payload.target_language)
        )
    except RuntimeError as e:
        raise HTTPException(503, str(e))
