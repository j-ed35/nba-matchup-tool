from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import teams, matchup, players

app = FastAPI(title="NBA Matchup Tool API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://matchuptool.vercel.app",
        "https://matchuptool-jacobs-projects-eda823cc.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(teams.router, prefix="/api", tags=["teams"])
app.include_router(matchup.router, prefix="/api", tags=["matchup"])
app.include_router(players.router, prefix="/api", tags=["players"])


@app.get("/api/health")
async def health_check():
    from app.config import Config
    return {
        "status": "ok",
        "keys_configured": {
            "NBA_API_KEY": bool(Config.NBA_API_KEY),
            "NBA_STANDINGS_KEY": bool(Config.NBA_STANDINGS_KEY),
            "QUERY_TOOL_API_KEY": bool(Config.QUERY_TOOL_API_KEY),
            "STATS_API_KEY": bool(Config.STATS_API_KEY),
        }
    }
