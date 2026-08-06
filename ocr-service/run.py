"""
Entrypoint for the OCR/AI microservice.

Runs FastAPI through Hypercorn (an ASGI server) instead of uvicorn.
Usage:  python run.py
"""
import asyncio
import os

from hypercorn.asyncio import serve
from hypercorn.config import Config

from app.main import app


def main():
    config = Config()
    host = os.getenv("HOST", "0.0.0.0")
    port = os.getenv("PORT", "8001")
    config.bind = [f"{host}:{port}"]
    config.use_reloader = os.getenv("RELOAD", "true").lower() == "true"
    asyncio.run(serve(app, config))


if __name__ == "__main__":
    main()
