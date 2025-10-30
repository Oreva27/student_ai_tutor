from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str
    gemini_api_url: str
    port: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
