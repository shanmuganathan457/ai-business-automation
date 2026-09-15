from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.core.config import settings
from app.core.logging import setup_logging
from app.db.session import engine, Base
from app.api import auth, documents, chat, assistant, health

# Initialize structured logging
setup_logging()

# Auto-create tables on startup if migrations haven't run
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI Business Automation Platform with RAG, pgvector, and FastAPI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api/v1 prefix
api_prefix = settings.API_V1_STR
app.include_router(health.router, prefix=api_prefix)
app.include_router(auth.router, prefix=api_prefix)
app.include_router(documents.router, prefix=api_prefix)
app.include_router(chat.router, prefix=api_prefix)
app.include_router(assistant.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs_url": "/docs",
        "health_check": f"{api_prefix}/health"
    }
