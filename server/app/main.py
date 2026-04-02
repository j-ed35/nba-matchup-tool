from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import teams, matchup, players

app = FastAPI(title="Matchup Tool API", version="1.0.0")

# CORS
_origins = [
    "http://localhost:5173",
    "https://matchuptool.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
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
    return {"status": "ok"}
