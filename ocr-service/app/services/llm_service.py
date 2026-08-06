"""
AI layer: document classification, summarization, question answering,
and translation -- all powered by a local Ollama model. No API key,
no external service, no per-request cost -- just a model running on
your own machine (or any host you point OLLAMA_HOST at).

Install Ollama: https://ollama.com
Pull a model:   ollama pull llama3.2
Ollama serves an HTTP API on localhost:11434 by default; nothing else
to configure for local dev.
"""
import requests

from app.config import OLLAMA_HOST, OLLAMA_MODEL


def _call_llm(prompt: str, system: str, max_tokens: int = 1024) -> str:
    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "system": system,
                "stream": False,
                "options": {"num_predict": max_tokens},
            },
            timeout=120,
        )
        response.raise_for_status()
    except requests.exceptions.ConnectionError as e:
        raise RuntimeError(
            f"Could not reach Ollama at {OLLAMA_HOST}. Is `ollama serve` running, "
            f"and has `ollama pull {OLLAMA_MODEL}` been run?"
        ) from e
    except requests.exceptions.HTTPError as e:
        raise RuntimeError(f"Ollama returned an error: {e}") from e

    return response.json().get("response", "").strip()


def classify_document(text: str) -> str:
    """e.g. invoice / passport / medical report / contract / ID card."""
    return _call_llm(
        prompt=f"Classify this document into a short category label:\n\n{text[:4000]}",
        system="You classify documents. Reply with a single category label only, "
               "no punctuation, no explanation.",
        max_tokens=20,
    )


def summarize(text: str) -> str:
    return _call_llm(
        prompt=f"Summarize this document in 3-5 sentences:\n\n{text[:8000]}",
        system="You write concise, factual document summaries. No preamble.",
        max_tokens=400,
    )


def answer_question(text: str, question: str) -> str:
    return _call_llm(
        prompt=f"Document:\n{text[:8000]}\n\nQuestion: {question}",
        system="Answer only using information present in the document. "
               "If the answer isn't in the document, say so plainly.",
        max_tokens=500,
    )


def translate(text: str, target_language: str) -> str:
    return _call_llm(
        prompt=f"Translate the following text to {target_language}:\n\n{text[:4000]}",
        system="You are a precise document translator. Output only the translation, "
               "no notes or preamble.",
        max_tokens=2000,
    )
