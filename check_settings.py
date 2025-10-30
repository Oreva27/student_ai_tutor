# check_settings.py
from app.config import settings

print("GEMINI_API_KEY:", settings.gemini_api_key)
print("GEMINI_API_URL:", settings.gemini_api_url)
print("PORT:", settings.port)
