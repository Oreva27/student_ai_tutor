from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from app.gemini import generate_gemini_response
import uuid

app = FastAPI(title="Gemini Chatbot API")

# ✅ Allow requests from frontend (adjust origin if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to ["http://127.0.0.1:5500"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Add session middleware
app.add_middleware(SessionMiddleware, secret_key="super-secret-session-key")

# ✅ Serve static files (CSS, JS, images, etc.)
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# ✅ Templates directory (for index.html)
templates = Jinja2Templates(directory="frontend")

# ✅ In-memory session store
sessions = {}

# ✅ Model for incoming chat request
class ChatRequest(BaseModel):
    message: str


# ✅ Serve main page
@app.get("/", response_class=HTMLResponse)
def serve_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# ✅ Chat endpoint (handles messages & remembers session)
@app.post("/chat")
async def chat_endpoint(request: Request, chat_req: ChatRequest):
    session_id = request.cookies.get("session_id")

    if not session_id or session_id not in sessions:
        session_id = str(uuid.uuid4())
        sessions[session_id] = []

    user_message = chat_req.message.strip()
    conversation = sessions[session_id]
    conversation.append({"sender": "user", "text": user_message})

    try:
        bot_reply = generate_gemini_response(user_message)
    except Exception as e:
        bot_reply = f"[Local Test Mode] You said: {user_message} (Gemini failed: {str(e)})"

    conversation.append({"sender": "bot", "text": bot_reply})

    response = JSONResponse({"response": bot_reply, "session_id": session_id})
    response.set_cookie("session_id", session_id)
    return response


# ✅ Get full chat history
@app.get("/history")
async def get_history(request: Request):
    session_id = request.cookies.get("session_id")
    if not session_id or session_id not in sessions:
        return JSONResponse({"history": []})
    return JSONResponse({"history": sessions[session_id]})


# ✅ Reset chat session
@app.post("/reset")
async def reset_chat(request: Request):
    session_id = request.cookies.get("session_id")
    if session_id and session_id in sessions:
        del sessions[session_id]
    response = JSONResponse({"message": "Chat reset successfully"})
    response.delete_cookie("session_id")
    return response


# ✅ Entry point for local run
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

