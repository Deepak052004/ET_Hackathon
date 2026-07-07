from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://safetynexus:safetynexus123@localhost:5432/safetynexus_db"
    REDIS_URL: str = "redis://localhost:6379"
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "safetynexus123"
    CHROMADB_HOST: str = "localhost"
    CHROMADB_PORT: int = 8001
    GEMINI_API_KEY: str = ""
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
