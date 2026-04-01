from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LLM backend: "cli" (Claude Code subprocess) or "api" (Anthropic SDK)
    LLM_BACKEND: str = "cli"

    # Anthropic API key (경로 B only)
    ANTHROPIC_API_KEY: str = ""

    # Data directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOADS_DIR: Path = DATA_DIR / "uploads"
    SESSIONS_DIR: Path = DATA_DIR / "sessions"
    ARCHIVE_DIR: Path = DATA_DIR / "archive"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # CLI backend
    CLI_TIMEOUT: int = 120
    CLI_MODEL: str = "claude-sonnet-4-20250514"

    # Session
    DISCUSS_TIMEOUT_SECONDS: int = 30
    CHALLENGE_EVERY_N_SEGMENTS: int = 4

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    def ensure_dirs(self) -> None:
        for d in (self.UPLOADS_DIR, self.SESSIONS_DIR, self.ARCHIVE_DIR):
            d.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_dirs()
