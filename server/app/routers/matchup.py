import asyncio
from fastapi import APIRouter, HTTPException, Query
from cachetools import TTLCache

from app.services.nba_client import NBAClient
from app.services.team_stats import normalize_team_stats, extract_standings_for_teams
from app.services.game_finder import process_h2h_games
from app.models.schemas import MatchupResponse, TeamStats, H2HGame

router = APIRouter()

# Cache matchup data for 15 minutes
_matchup_cache = TTLCache(maxsize=64, ttl=900)

MEASURE_TYPES = ["Base", "Advanced", "Misc", "Opponent"]


@router.get("/matchup", response_model=MatchupResponse)
async def get_matchup(
    team1_id: str = Query(..., description="Team 1 ID"),
    team2_id: str = Query(..., description="Team 2 ID"),
    season_type: str = Query("Regular Season", description="Season type"),
):
    cache_key = f"matchup:{team1_id}:{team2_id}:{season_type}"

    if cache_key in _matchup_cache:
        return _matchup_cache[cache_key]

    client = NBAClient()
    team_ids = [team1_id, team2_id]

    try:
        # Build all tasks for parallel execution
        tasks = []

        # 1. Team stats for each measure type
        for mt in MEASURE_TYPES:
            tasks.append(client.get_team_stats(team_ids, measure_type=mt, season_type=season_type))

        # 2. H2H games (both directions)
        tasks.append(client.get_h2h_games(team1_id, team2_id, season_type=season_type))
        tasks.append(client.get_h2h_games(team2_id, team1_id, season_type=season_type))

        # 3. Standings
        tasks.append(client.get_standings(season_type=season_type))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Check for errors
        for i, r in enumerate(results):
            if isinstance(r, Exception):
                raise HTTPException(status_code=502, detail=f"NBA API request {i} failed: {str(r)}")

        # Unpack results
        stat_responses = {mt: results[i] for i, mt in enumerate(MEASURE_TYPES)}
        h2h_team1_data = results[len(MEASURE_TYPES)]
        h2h_team2_data = results[len(MEASURE_TYPES) + 1]
        standings_data = results[len(MEASURE_TYPES) + 2]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch matchup data: {str(e)}")

    # Process team stats
    team_stats = normalize_team_stats(stat_responses, team_ids)

    # Process standings
    standings_info = extract_standings_for_teams(standings_data, team_ids)

    # Process H2H games
    h2h_games = process_h2h_games(h2h_team1_data, h2h_team2_data, team1_id, team2_id)

    # Build response
    def build_team(tid: str) -> TeamStats:
        ts = team_stats.get(tid, {"stats": {}, "stats_ranks": {}, "abbreviation": ""})
        si = standings_info.get(tid, {"record": "0-0", "conf_rank": None})
        stats = dict(ts.get("stats", {}))

        # Inject W/L/W_PCT from standings (not available in stats API)
        if si.get("wins") is not None:
            stats["W"] = si["wins"]
        if si.get("losses") is not None:
            stats["L"] = si["losses"]
        if si.get("win_pct") is not None:
            stats["W_PCT"] = si["win_pct"]

        return TeamStats(
            id=int(tid),
            abbreviation=ts.get("abbreviation", si.get("abbreviation", "")),
            stats=stats,
            stats_ranks=ts.get("stats_ranks", {}),
            record=si.get("record", "0-0"),
            conf_rank=si.get("conf_rank"),
        )

    response = MatchupResponse(
        team1=build_team(team1_id),
        team2=build_team(team2_id),
        h2h_games=[H2HGame(**g) for g in h2h_games],
    )

    _matchup_cache[cache_key] = response
    return response
