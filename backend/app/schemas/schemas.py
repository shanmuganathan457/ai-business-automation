from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.models.models import UserRole, DocumentStatus, TaskStatus, TaskPriority

# Auth & User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(..., min_length=6)
    role: Optional[UserRole] = UserRole.EMPLOYEE

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    status: DocumentStatus
    created_at: datetime

    class Config:
        from_attributes = True

# Chat & RAG Schemas
class ChatQueryRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    max_sources: Optional[int] = 3

class SourceCitation(BaseModel):
    document_id: str
    filename: str
    chunk_index: int
    text_snippet: str
    similarity_score: float

class ChatQueryResponse(BaseModel):
    prompt: str
    response: str
    provider: str
    citations: List[SourceCitation]
    confidence_score: float

# Task Schemas
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    created_by_id: str
    created_at: datetime

    class Config:
        from_attributes = True
