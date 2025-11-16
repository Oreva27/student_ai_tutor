import os
import re
import html
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from app.gemini import generate_gemini_response
import uuid

# ✅ Load .env file (for your Google API key)
print("🔹 Loading .env file...")
load_dotenv()

# ✅ Check if the API key is found
if os.getenv("GOOGLE_API_KEY"):
    print("✅ GOOGLE_API_KEY found!")
else:
    print("⚠️ GOOGLE_API_KEY not found in .env file!")


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
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET", "fallback-secret"))

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

quiz_state = {}  # 🧩 store temporary quiz state per session

@app.post("/chat")
async def chat_endpoint(request: Request, chat_req: ChatRequest, response: Response):
    # -------- SESSION LOGIC --------
    session_id = request.cookies.get("session_id")
    if not session_id:
        session_id = str(uuid.uuid4())

    # -------- GEMINI RESPONSE (sync) --------
    # Your generate_gemini_response is synchronous, call it directly
    gemini_response_text = generate_gemini_response(chat_req.message)

    # ensure string
    if gemini_response_text is None:
        gemini_response_text = ""

    # -------- FORMAT THE TEXT INTO SAFE HTML --------
    # 1) Escape any HTML
    escaped = html.escape(gemini_response_text)

    # 2) Normalize newlines
    escaped = escaped.replace("\r\n", "\n").replace("\r", "\n")

    # 3) Split into paragraphs on 2+ newlines
    paras = [p.strip() for p in re.split(r'\n{2,}', escaped) if p.strip()]

    # 4) Convert remaining single newlines into <br> inside paragraphs
    safe_paragraphs = []
    for p in paras:
        p_with_breaks = p.replace("\n", "<br>")
        safe_paragraphs.append(f"<p>{p_with_breaks}</p>")

    # If no paragraphs were found (single-line reply), still wrap it
    safe_html = "\n".join(safe_paragraphs) if safe_paragraphs else f"<p>{escaped.replace(chr(10),'<br>')}</p>"

    # (Optional) small post-processing: convert **bold** markers to <strong>
    # Do this only on escaped content to avoid injecting HTML.
    # Example: convert escaped **text** (i.e. \*\*text\*\*) to <strong>text</strong>
    safe_html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', safe_html)

    # -------- RETURN both plain text and safe HTML --------
    payload = {
        "response": gemini_response_text,  # original plain text
        "html": safe_html,                 # formatted, safe HTML
        "session_id": session_id
    }

    resp = JSONResponse(payload)
    # persist cookie for client (use same attributes used earlier)
    resp.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        samesite="none",
        secure=True  
    )
    return resp

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

