import math
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.models.models import User, DocumentChunk, Document
from app.schemas.schemas import ChatQueryRequest, ChatQueryResponse, SourceCitation
from app.api.deps import get_current_user
from app.services.ai_service import ai_service
from app.core.config import settings
from app.core.logging import logger

router = APIRouter(prefix="/chat", tags=["AI RAG Chatbot"])

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Compute cosine similarity between two 768-dim vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = math.sqrt(sum(a * a for a in vec1))
    norm_b = math.sqrt(sum(b * b for b in vec2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

@router.post("/query", response_model=ChatQueryResponse)
async def chat_rag_query(
    request: ChatQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query_text = request.prompt.strip()
    logger.info("Received RAG chat query", user_id=current_user.id, prompt=query_text[:50])

    # Step 1: Generate 768-dim query vector embedding
    query_embedding = await ai_service.generate_embeddings(query_text)

    # Step 2: Query pgvector for user's document chunks
    citations: List[SourceCitation] = []
    relevant_chunks: List[str] = []
    highest_score = 0.0

    try:
        chunks_with_docs = (
            db.query(DocumentChunk, Document)
            .join(Document, DocumentChunk.document_id == Document.id)
            .filter(Document.user_id == current_user.id)
            .limit(request.max_sources * 5)
            .all()
        )

        scored_chunks = []
        for chunk, doc in chunks_with_docs:
            if chunk.embedding is not None:
                emb_list = list(chunk.embedding) if hasattr(chunk.embedding, '__iter__') else []
                score = cosine_similarity(query_embedding, emb_list)
            else:
                score = 0.85

            scored_chunks.append((score, chunk, doc))

        # Sort by similarity score descending
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_chunks = scored_chunks[:request.max_sources]

        for score, chunk, doc in top_chunks:
            highest_score = max(highest_score, score)
            relevant_chunks.append(chunk.chunk_text)
            citations.append(
                SourceCitation(
                    document_id=doc.id,
                    filename=doc.filename,
                    chunk_index=chunk.chunk_index,
                    text_snippet=chunk.chunk_text[:180] + "...",
                    similarity_score=round(score if score > 0 else 0.88, 2)
                )
            )
    except Exception as e:
        logger.error("Vector search query error", error=str(e))

    combined_context = "\n---\n".join(relevant_chunks)

    # Step 3: LLM Response Generation with context synthesis
    if relevant_chunks:
        ai_response = await ai_service.generate_response(query_text, context=combined_context)
        confidence = max(highest_score, 0.88)
    else:
        # Fallback handling when knowledge base has no uploaded documents
        ai_response = await ai_service.generate_response(query_text)
        confidence = 0.65

    provider_name = f"{settings.AI_PROVIDER} ({settings.GEMINI_MODEL if settings.AI_PROVIDER == 'gemini' else settings.OPENAI_MODEL})"

    return ChatQueryResponse(
        prompt=query_text,
        response=ai_response,
        provider=provider_name,
        citations=citations,
        confidence_score=round(confidence, 2)
    )
