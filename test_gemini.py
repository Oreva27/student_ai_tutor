# test_gemini.py
import httpx
from app.config import settings
import asyncio

async def main():
    url = settings.gemini_api_url
    headers = {"Authorization": f"Bearer {settings.gemini_api_key}", "Content-Type": "application/json"}
    payload = {"prompt": "Hello Gemini! Explain NLP in simple terms for students.", "max_output_tokens": 200}

    async with httpx.AsyncClient() as client:
        r = await client.post(url, json=payload, headers=headers)
        print("Status code:", r.status_code)
        print("Response:", r.text)

asyncio.run(main())
