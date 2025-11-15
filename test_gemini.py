# test_gemini.py
import os
from dotenv import load_dotenv
import httpx
import asyncio

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

# ✅ Correct Gemini endpoint for text requests
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


async def main():
    headers = {
        "Content-Type": "application/json",
    }

    payload = {
        "contents": [
            {"parts": [{"text": "Hello Gemini! Explain NLP in simple terms for students."}]}
        ]
    }

    # ✅ Send request with API key as query parameter (not Bearer token)
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{GEMINI_URL}?key={API_KEY}", json=payload, headers=headers)

        print("Status code:", response.status_code)
        print("Response:", response.text)


asyncio.run(main())
