from fastapi import APIRouter, HTTPException
from cachetools import TTLCache

from app.services.nba_client import NBAClient

router = APIRouter()

_standings_cache = TTLCache(maxsize=4, ttl=3600)
_bracket_cache = TTLCache(maxsize=4, ttl=900)


@router.get("/standings")
async def get_standings(season_type: str = "Regular Season"):
    cache_key = f"standings:{season_type}"

    if cache_key in _standings_cache:
        return _standings_cache[cache_key]

    client = NBAClient()
    try:
        raw = await client.get_standings(season_type=season_type)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch standings: {str(e)}")

    # Response: { "leagueStandings": { "teams": [...] } }
    league_standings = raw.get("leagueStandings", {})
    teams_list = league_standings.get("teams", [])

    standings = []
    for team in teams_list:
        wins = team.get("wins", 0) or 0
        losses = team.get("losses", 0) or 0
        standings.append({
            "team_id": int(team.get("teamId", 0)),
            "team_abbreviation": team.get("teamAbbreviation", ""),
            "team_name": team.get("teamName", ""),
            "conference": team.get("conference", ""),
            "conf_rank": team.get("playoffRank") or team.get("playoffSeeding") or 0,
            "wins": wins,
            "losses": losses,
            "win_pct": float(team.get("winPct", 0) or 0),
            "home_record": team.get("home", ""),
            "road_record": team.get("road", ""),
            "last_10": team.get("l10", ""),
            "streak": team.get("currentStreakText", ""),
        })

    result = {"standings": standings}
    _standings_cache[cache_key] = result
    return result


@router.get("/playoff-bracket")
async def get_playoff_bracket():
    cache_key = "playoff_bracket"

    if cache_key in _bracket_cache:
        return _bracket_cache[cache_key]

    client = NBAClient()
    try:
        raw = await client.get_playoff_bracket()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch playoff bracket: {str(e)}")

    result = raw
    _bracket_cache[cache_key] = result
    return result
