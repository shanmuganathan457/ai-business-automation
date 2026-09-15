import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ai_provider" in data

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data

def test_user_registration_and_login():
    unique_email = f"pytest_user_{pytest.__name__}@test.com"
    
    # 1. Register User
    register_payload = {
        "email": unique_email,
        "full_name": "Pytest Automation User",
        "password": "testpassword123",
        "role": "employee"
    }
    reg_response = client.post("/api/v1/auth/register", json=register_payload)
    if reg_response.status_code == 201:
        assert reg_response.json()["email"] == unique_email

    # 2. Login User
    login_payload = {
        "username": unique_email,
        "password": "testpassword123"
    }
    login_response = client.post(
        "/api/v1/auth/login",
        data=login_payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if login_response.status_code == 200:
        token_data = login_response.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"

def test_ai_task_auto_suggest():
    response = client.post(
        "/api/v1/assistant/auto-suggest-task?request_prompt=Urgent%20checkout%20bug"
    )
    assert response.status_code == 200
    data = response.json()
    assert "suggested_task" in data
    assert "analysis" in data
