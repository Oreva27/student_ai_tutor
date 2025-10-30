from pydantic import BaseModel  # keep BaseModel for models

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None  # Pydantic v2 syntax

class ChatResponse(BaseModel):
    reply: str
    model: str | None = None
