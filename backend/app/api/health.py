from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "ai_provider": settings.AI_PROVIDER,
        "gemini_model": settings.GEMINI_MODEL
    }
