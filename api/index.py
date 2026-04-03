import sys
from pathlib import Path

# Add server directory to Python path so imports work
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "server"))

from app.main import app  # noqa: E402, F401
