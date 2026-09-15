import httpx
from typing import List, Tuple
from app.core.config import settings
from app.core.logging import logger

class AIService:
    @staticmethod
    async def generate_embeddings(text: str) -> List[float]:
        """Generate 768-dim vector embeddings using Gemini or fallback to zero vector."""
        if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.EMBEDDING_MODEL}:embedContent?key={settings.GEMINI_API_KEY}"
                payload = {
                    "model": settings.EMBEDDING_MODEL,
                    "content": {"parts": [{"text": text[:2000]}]}
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        embedding_values = data.get("embedding", {}).get("values", [])
                        if embedding_values and len(embedding_values) == 768:
                            return embedding_values
            except Exception as e:
                logger.error("Gemini embedding generation failed", error=str(e))

        # Fallback dummy 768-dim vector if no key provided
        return [0.0] * 768

    @staticmethod
    async def generate_response(prompt: str, context: str = "") -> str:
        """Generate response using configured AI provider (Gemini / OpenAI / Mock)."""
        system_context = f"Company Knowledge Base Context:\n{context}\n\nUser Question: {prompt}" if context else prompt

        if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
                payload = {
                    "contents": [{"parts": [{"text": system_context}]}]
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        return data["candidates"][0]["content"]["parts"][0]["text"]
                    else:
                        logger.error("Gemini API error", status=res.status_code, response=res.text)
            except Exception as e:
                logger.error("Gemini call exception", error=str(e))

        # Fallback Mock AI Engine
        if context:
            return f"[AI Assistant Context Response] Based on company documents:\n{context[:300]}...\nAnswer: {prompt}"
        return f"[AI Assistant Response] Processed: '{prompt}'. Ready for production AI key integration!"

ai_service = AIService()
