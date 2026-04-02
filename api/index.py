import sys
import os

# Add the server directory to the Python path so app.* imports resolve
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'server'))

from app.main import app  # noqa: E402
