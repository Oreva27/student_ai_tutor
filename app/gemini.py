import os
from dotenv import load_dotenv
import google.generativeai as genai

print("🔹 Loading .env file...")
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("❌ GOOGLE_API_KEY not found! Check your .env file path or spelling.")
else:
    print("✅ GOOGLE_API_KEY found!")

print("🔹 Configuring Gemini model...")
genai.configure(api_key=GOOGLE_API_KEY)

# ✅ Use the Gemini 2.5 model
model = genai.GenerativeModel("gemini-2.5-flash")


def generate_gemini_response(prompt_text: str) -> str:
    """
    Sends text input to the Gemini 2.5 model and returns its response.
    """
    print("🔹 Generating response...")
    try:
        response = model.generate_content(prompt_text)

        # Check if Gemini returned text
        if hasattr(response, "text") and response.text:
            print("✅ Gemini replied:")
            print(response.text)
            return response.text
        else:
            print("⚠️ No text found in Gemini response.")
            return "⚠️ Gemini did not return any text."
    except Exception as e:
        print(f"❌ Error occurred: {str(e)}")
        return f"⚠️ Gemini API Error: {str(e)}"
