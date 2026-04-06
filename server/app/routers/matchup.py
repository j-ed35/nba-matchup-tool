import asyncio
from fastapi import APIRouter, HTTPException, Query
from cachetools import TTLCache

from app.services.nba_client import NBAClient
from app.services.team_stats import normalize_team_stats, normalize_all_team_stats, compute_league_ranks, extract_standings_for_teams
from app.services.game_finder import process_h2h_games
from app.services.h2h_stats import process_h2h_team_stats
from app.services.player_stats import process_player_stats
from app.models.schemas import MatchupResponse, TeamStats, H2HGame, H2HStatsResponse, H2HTeamStats, PlayerStatsResponse

router = APIRouter()

# Cache matchup data for 15 minutes
_matchup_cache = TTLCache(maxsize=64, ttl=900)

# Cache H2H stats for 30 minutes
_h2h_stats_cache = TTLCache(maxsize=64, ttl=1800)
_h2h_players_cache = TTLCache(maxsize=64, ttl=1800)

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

        # 1. Team stats for each measure type (just the 2 teams)
        for mt in MEASURE_TYPES:
            tasks.append(client.get_team_stats(team_ids, measure_type=mt, season_type=season_type))

        # 2. H2H games (both directions)
        tasks.append(client.get_h2h_games(team1_id, team2_id, season_type=season_type))
        tasks.append(client.get_h2h_games(team2_id, team1_id, season_type=season_type))

        # 3. Standings
        tasks.append(client.get_standings(season_type=season_type))

        # 4. All teams' stats for league-wide ranking (Base + Advanced)
        for mt in ["Base", "Advanced"]:
            tasks.append(client.get_all_team_stats(measure_type=mt, season_type=season_type))

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

        # All-teams stats for ranking
        league_rank_types = ["Base", "Advanced"]
        league_stat_responses = {}
        for j, mt in enumerate(league_rank_types):
            idx = len(MEASURE_TYPES) + 3 + j
            if idx < len(results) and not isinstance(results[idx], Exception):
                league_stat_responses[mt] = results[idx]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch matchup data: {str(e)}")

    # Process team stats
    team_stats = normalize_team_stats(stat_responses, team_ids)

    # Compute league-wide percentile ranks
    league_ranks = {}
    if league_stat_responses:
        all_team_stats = normalize_all_team_stats(league_stat_responses)
        league_ranks = compute_league_ranks(all_team_stats, team_ids)

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
            stats_ranks=league_ranks.get(tid, {}),
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


@router.get("/matchup/h2h-stats", response_model=H2HStatsResponse)
async def get_h2h_stats(
    team1_id: str = Query(..., description="Team 1 ID"),
    team2_id: str = Query(..., description="Team 2 ID"),
    season_type: str = Query("Regular Season", description="Season type"),
):
    cache_key = f"h2h_stats:{team1_id}:{team2_id}:{season_type}"
    if cache_key in _h2h_stats_cache:
        return _h2h_stats_cache[cache_key]

    client = NBAClient()

    try:
        # 4 parallel calls: Base + Advanced stats for each opponent direction
        base_vs_t2, base_vs_t1, adv_vs_t2, adv_vs_t1 = await asyncio.gather(
            client.get_season_team_vs_opponent(opp_team_id=team2_id, measure_type="Base", season_type=season_type),
            client.get_season_team_vs_opponent(opp_team_id=team1_id, measure_type="Base", season_type=season_type),
            client.get_season_team_vs_opponent(opp_team_id=team2_id, measure_type="Advanced", season_type=season_type),
            client.get_season_team_vs_opponent(opp_team_id=team1_id, measure_type="Advanced", season_type=season_type),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch H2H stats: {str(e)}")

    # team1's stats vs team2 (from "all teams vs team2" responses)
    team1_result = process_h2h_team_stats(base_vs_t2, adv_vs_t2, team1_id)
    # team2's stats vs team1 (from "all teams vs team1" responses)
    team2_result = process_h2h_team_stats(base_vs_t1, adv_vs_t1, team2_id)

    response = H2HStatsResponse(
        team1=H2HTeamStats(**team1_result),
        team2=H2HTeamStats(**team2_result),
    )

    _h2h_stats_cache[cache_key] = response
    return response


@router.get("/matchup/h2h-players", response_model=PlayerStatsResponse)
async def get_h2h_players(
    team1_id: str = Query(..., description="Team 1 ID"),
    team2_id: str = Query(..., description="Team 2 ID"),
    season_type: str = Query("Regular Season", description="Season type"),
):
    cache_key = f"h2h_players:{team1_id}:{team2_id}:{season_type}"
    if cache_key in _h2h_players_cache:
        return _h2h_players_cache[cache_key]

    client = NBAClient()

    try:
        raw1, raw2 = await asyncio.gather(
            client.get_season_player_vs_opponent(team_id=team1_id, opp_team_id=team2_id, season_type=season_type),
            client.get_season_player_vs_opponent(team_id=team2_id, opp_team_id=team1_id, season_type=season_type),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch H2H player stats: {str(e)}")

    team1_players = process_player_stats(raw1, [team1_id]).get(str(team1_id), [])
    team2_players = process_player_stats(raw2, [team2_id]).get(str(team2_id), [])

    response = PlayerStatsResponse(team1_players=team1_players, team2_players=team2_players)
    _h2h_players_cache[cache_key] = response
    return response
