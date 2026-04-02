import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root or server directory
_env_paths = [
    Path(__file__).resolve().parent.parent.parent.parent / ".env",  # project root
    Path(__file__).resolve().parent.parent.parent / ".env",  # server dir
]
for p in _env_paths:
    if p.exists():
        load_dotenv(p)
        break
else:
    load_dotenv()


class Config:
    NBA_API_KEY: str = os.getenv("NBA_API_KEY", "")
    NBA_STANDINGS_KEY: str = os.getenv("NBA_STANDINGS_KEY", "")
    QUERY_TOOL_API_KEY: str = os.getenv("QUERY_TOOL_API_KEY", "")
    STATS_API_KEY: str = os.getenv("STATS_API_KEY", "")
