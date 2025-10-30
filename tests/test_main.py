from fastapi.testclient import TestClient
import pytest

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_chat_monkeypatch(monkeypatch):
    # Fake async generate function to simulate API response
    async def fake_generate(prompt, session_id=None):
        return f"Echo: {prompt}"

    # Monkeypatch the client.generate method in main.py
    from app import main
    monkeypatch.setattr(main.client, "generate", fake_generate)

    # Send a test message to the /chat endpoint
    test_message = {
        "message": "Hello Gemini! Can you explain what NLP is?",
        "session_id": "test123"
    }
    r = client.post("/chat", json=test_message)
    assert r.status_code == 200
    data = r.json()
    assert data["reply"] == f"Echo: {test_message['message']}"
    assert data["model"] == "gemini-adapter"
