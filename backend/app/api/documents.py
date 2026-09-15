import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session
from pypdf import PdfReader

from app.db.session import get_db
from app.models.models import User, Document, DocumentChunk, DocumentStatus
from app.schemas.schemas import DocumentResponse
from app.api.deps import get_current_user
from app.services.ai_service import ai_service
from app.core.logging import logger

router = APIRouter(prefix="/documents", tags=["Document Management"])

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def process_document_background(document_id: str, filepath: str, db_session_factory):
    """Background task to extract text, chunk document, generate embeddings, and update status."""
    db: Session = db_session_factory()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return

        text_content = ""
        if filepath.endswith(".pdf"):
            reader = PdfReader(filepath)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_content += extracted + "\n"
        else:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                text_content = f.read()

        doc.text_content = text_content

        # Simple text chunking (500 chars per chunk)
        chunks = [text_content[i:i+500] for i in range(0, len(text_content), 450)] if text_content else [filename]
        
        for idx, chunk_text in enumerate(chunks[:20]): # Limit initial chunks
            embedding_vector = await ai_service.generate_embeddings(chunk_text)
            chunk = DocumentChunk(
                document_id=doc.id,
                chunk_index=idx,
                chunk_text=chunk_text,
                embedding=embedding_vector
            )
            db.add(chunk)

        doc.status = DocumentStatus.READY
        db.commit()
        logger.info("Document background processing completed", document_id=document_id, chunks_count=len(chunks))

    except Exception as e:
        logger.error("Failed background document processing", document_id=document_id, error=str(e))
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = DocumentStatus.FAILED
            db.commit()
    finally:
        db.close()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allowed_extensions = [".pdf", ".txt", ".md", ".docx"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(filepath)

    document = Document(
        filename=file.filename,
        filepath=filepath,
        file_type=file_ext,
        file_size=file_size,
        status=DocumentStatus.PROCESSING,
        user_id=current_user.id
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Schedule background extraction & vector embedding
    from app.db.session import SessionLocal
    background_tasks.add_task(process_document_background, document.id, filepath, SessionLocal)

    return document

@router.get("/", response_model=List[DocumentResponse])
def list_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Document).filter(Document.user_id == current_user.id).all()
