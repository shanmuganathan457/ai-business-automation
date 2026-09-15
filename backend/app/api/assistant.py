from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import User, Task, TaskStatus, TaskPriority
from app.schemas.schemas import TaskCreate, TaskUpdate, TaskResponse
from app.api.deps import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(prefix="/assistant", tags=["AI Business Assistant & Tasks"])

@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = Task(
        title=task_in.title,
        description=task_in.description,
        priority=task_in.priority or TaskPriority.MEDIUM,
        created_by_id=current_user.id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/tasks", response_model=List[TaskResponse])
def list_tasks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Task).filter(Task.created_by_id == current_user.id).all()

@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task_in: TaskUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.created_by_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_in.title is not None:
        task.title = task_in.title
    if task_in.description is not None:
        task.description = task_in.description
    if task_in.status is not None:
        task.status = task_in.status
    if task_in.priority is not None:
        task.priority = task_in.priority

    db.commit()
    db.refresh(task)
    return task

@router.post("/auto-suggest-task")
async def ai_auto_suggest_task(request_prompt: str, current_user: User = Depends(get_current_user)):
    """AI endpoint that analyzes a business request and auto-suggests structured actionable tasks."""
    prompt = f"Analyze this business request and suggest a structured task title and priority (LOW, MEDIUM, HIGH):\n'{request_prompt}'"
    ai_suggestion = await ai_service.generate_response(prompt)
    return {
        "analysis": ai_suggestion,
        "suggested_task": {
            "title": f"Follow up: {request_prompt[:40]}...",
            "priority": "HIGH" if "urgent" in request_prompt.lower() else "MEDIUM"
        }
    }
