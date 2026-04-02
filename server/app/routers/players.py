from __future__ import annotations

import asyncio
from fastapi import APIRouter, HTTPException, Query
from cachetools import TTLCache

from app.services.nba_client import NBAClient
from app.services.player_stats import process_player_stats
from app.models.schemas import PlayerStatsResponse

router = APIRouter()

_player_cache = TTLCache(maxsize=64, ttl=1800)


@router.get("/matchup/players", response_model=PlayerStatsResponse)
async def get_matchup_players(
    team1_id: str = Query(...),
    team2_id: str = Query(...),
    season_type: str = Query("Regular Season"),
):
    cache_key = f"players:{team1_id}:{team2_id}:{season_type}"
    if cache_key in _player_cache:
        return _player_cache[cache_key]

    client = NBAClient()
    try:
        raw1, raw2 = await asyncio.gather(
            client.get_player_stats(team1_id, season_type=season_type),
            client.get_player_stats(team2_id, season_type=season_type),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch player stats: {str(e)}")

    team1_players = process_player_stats(raw1, [team1_id]).get(str(team1_id), [])
    team2_players = process_player_stats(raw2, [team2_id]).get(str(team2_id), [])

    response = PlayerStatsResponse(team1_players=team1_players, team2_players=team2_players)
    _player_cache[cache_key] = response
    return response
