# app/gemini_client.py
from typing import Optional
import random

class GeminiClient:
    def __init__(self, use_fake: bool = False):
        self.use_fake = use_fake

    async def generate(self, prompt: str, session_id: Optional[str] = None) -> str:
        if self.use_fake:
            # Return a fake response
            fake_responses = [
                f"I see you said: '{prompt}'. Here's a simple explanation: NLP is how computers understand human language.",
                f"You asked: '{prompt}'. NLP allows machines to read, understand, and respond to text!",
                f"Hello! About '{prompt}': NLP is a way for machines to learn human language."
            ]
            return random.choice(fake_responses)
        
        # Here you would call the real API later
        raise NotImplementedError("Real API not implemented yet")

# For testing without API
def get_sync_client(fake: bool = True):
    return GeminiClient(use_fake=fake)
