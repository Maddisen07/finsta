import os
import sys
import uuid

# Ensure backend directory is in sys.path for robust imports from both root and backend dir
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from db import Base, engine
from routes.chat import router as chat_router
from routes.calculators import router as calc_router
from routes.profile import router as profile_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FinSta API - Your Smart Money Sidekick",
    description="Backend API for FinSta, an AI-powered conversational financial coaching assistant.",
    version="1.0.0"
)

# CORS configuration - Allow all origins cleanly for seamless Vercel <-> Render communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standardized Error Handlers matching: {error_code, message, request_id}
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    error_code = f"HTTP_{exc.status_code}"
    msg = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": error_code,
            "message": msg,
            "request_id": request_id
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error_code": "VALIDATION_ERROR",
            "message": "Invalid request parameters provided.",
            "request_id": request_id
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred while processing your financial request. Please try again.",
            "request_id": request_id
        }
    )

# Register routes
app.include_router(chat_router)
app.include_router(calc_router)
app.include_router(profile_router)


@app.get("/")
def root():
    return {
        "name": "FinSta API",
        "tagline": "Your smart money sidekick",
        "status": "online",
        "version": "1.0.0",
        "disclaimer": "FinSta provides educational information, not professional financial advice."
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/health/llm")
def llm_health_check():
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    model = os.getenv("LLM_MODEL", "gemini-1.5-flash")
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "").strip()

    gemini_configured = bool(gemini_key and gemini_key != "mock" and not gemini_key.startswith("your_"))
    anthropic_configured = bool(anthropic_key and anthropic_key != "mock" and not anthropic_key.startswith("your_"))

    return {
        "status": "healthy",
        "provider": provider,
        "model": model,
        "gemini_api_key_configured": gemini_configured,
        "anthropic_api_key_configured": anthropic_configured,
        "active_engine": "Gemini Live API" if (provider == "gemini" and gemini_configured) else ("Anthropic Claude API" if (provider == "anthropic" and anthropic_configured) else "FinSta Built-in Financial Coaching Engine"),
        "note": "When API keys are not provided, FinSta seamlessly runs on its verified local financial math & three-tier advisory engine."
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
