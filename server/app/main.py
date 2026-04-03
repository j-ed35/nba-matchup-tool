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


@app.get("/api/debug/h2h-raw")
async def debug_h2h_raw(team1_id: str = "1610612753", team2_id: str = "1610612748"):
    """Temporary debug endpoint to inspect raw querytool API responses."""
    from app.services.nba_client import NBAClient
    client = NBAClient()
    try:
        base_data = await client.get_season_team_vs_opponent(opp_team_id=team2_id, measure_type="Base")
        player_data = await client.get_season_player_vs_opponent(team_id=team1_id, opp_team_id=team2_id)
        # Return first team and first player for inspection
        team_sample = None
        if isinstance(base_data, dict):
            teams_list = base_data.get("teams", [])
            if teams_list:
                team_sample = teams_list[0]
        player_sample = None
        if isinstance(player_data, dict):
            players_list = player_data.get("players", [])
            if players_list:
                player_sample = players_list[0]
        return {
            "team_sample": team_sample,
            "player_sample": player_sample,
            "team_count": len(base_data.get("teams", [])) if isinstance(base_data, dict) else 0,
            "player_count": len(player_data.get("players", [])) if isinstance(player_data, dict) else 0,
        }
    except Exception as e:
        return {"error": str(e)}
