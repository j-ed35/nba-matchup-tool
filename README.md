# NBA Matchup Tool

Side-by-side NBA team comparison tool for the 2025-26 season and playoffs.

## Stack
- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Python FastAPI
- **Data:** Official NBA API (api.nba.com/v0)

## Setup
1. Copy `.env.example` to `.env` and fill in API keys
2. Backend: `cd server && uv sync && uv run uvicorn app.main:app --reload`
3. Frontend: `cd client && npm install && npm run dev`
