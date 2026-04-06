from __future__ import annotations
import re


def _camel_to_upper_snake(name: str) -> str:
    """Convert camelCase to UPPER_SNAKE_CASE. e.g. fgPct -> FG_PCT, offRating -> OFF_RATING"""
    s1 = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1_\2', name)
    s2 = re.sub(r'([a-z\d])([A-Z])', r'\1_\2', s1)
    return s2.upper()


def normalize_team_stats(raw_responses: dict[str, dict], team_ids: list[str]) -> dict[str, dict]:
    """
    Normalize and merge team stats from multiple measure type responses.

    Stats API response format: { "teams": [ { "teamId": ..., "teamAbbreviation": ..., "stats": {...} } ] }

    Returns:
        dict mapping team_id (str) -> { "stats": {...}, "stats_ranks": {}, "abbreviation": str }
    """
    team_id_set = {str(tid) for tid in team_ids}
    merged: dict[str, dict] = {}

    for measure_type, raw_data in raw_responses.items():
        if not isinstance(raw_data, dict):
            continue

        teams_list = raw_data.get("teams", [])
        if not teams_list:
            continue

        for team_obj in teams_list:
            tid = str(team_obj.get("teamId", ""))
            if tid not in team_id_set:
                continue

            if tid not in merged:
                merged[tid] = {
                    "stats": {},
                    "stats_ranks": {},
                    "abbreviation": team_obj.get("teamAbbreviation", ""),
                }

            # Merge stats from this measure type
            stats_obj = team_obj.get("stats", {})
            for key, value in stats_obj.items():
                snake_key = _camel_to_upper_snake(key)
                if snake_key.endswith("_RANK"):
                    merged[tid]["stats_ranks"][snake_key] = value
                else:
                    merged[tid]["stats"][snake_key] = value

    return merged


LOWER_IS_BETTER = {"TOV", "PF", "DEF_RATING", "L", "OPP_PTS_OFF_TOV", "OPP_PTS2ND_CHANCE", "OPP_PTS_FB", "OPP_PTS_PAINT"}


def normalize_all_team_stats(raw_responses: dict[str, dict]) -> dict[str, dict]:
    """Normalize stats for ALL teams from multiple measure type responses (no team filter)."""
    merged: dict[str, dict] = {}

    for measure_type, raw_data in raw_responses.items():
        if not isinstance(raw_data, dict):
            continue
        teams_list = raw_data.get("teams", [])
        for team_obj in teams_list:
            tid = str(team_obj.get("teamId", ""))
            if not tid:
                continue
            if tid not in merged:
                merged[tid] = {"stats": {}, "abbreviation": team_obj.get("teamAbbreviation", "")}
            stats_obj = team_obj.get("stats", {})
            for key, value in stats_obj.items():
                snake_key = _camel_to_upper_snake(key)
                if not snake_key.endswith("_RANK"):
                    merged[tid]["stats"][snake_key] = value

    return merged


def compute_league_ranks(all_team_stats: dict[str, dict], target_team_ids: list[str]) -> dict[str, dict]:
    """
    Compute percentile ranks (0-100) for target teams relative to all 30 teams.

    Returns dict mapping team_id -> { "STAT_KEY_RANK": percentile_value, ... }
    """
    # Collect all stat keys
    all_stat_keys: set[str] = set()
    for ts in all_team_stats.values():
        all_stat_keys.update(ts.get("stats", {}).keys())

    # Filter to numeric stats only
    numeric_keys = set()
    for key in all_stat_keys:
        for ts in all_team_stats.values():
            val = ts.get("stats", {}).get(key)
            if isinstance(val, (int, float)):
                numeric_keys.add(key)
                break

    target_set = {str(tid) for tid in target_team_ids}
    ranks: dict[str, dict] = {tid: {} for tid in target_set}

    for stat_key in numeric_keys:
        # Gather all teams' values for this stat
        team_values = []
        for tid, ts in all_team_stats.items():
            val = ts.get("stats", {}).get(stat_key)
            if isinstance(val, (int, float)):
                team_values.append((tid, val))

        if not team_values:
            continue

        n = len(team_values)
        # Sort: for LOWER_IS_BETTER, lower value = better = higher percentile
        reverse = stat_key not in LOWER_IS_BETTER
        team_values.sort(key=lambda x: x[1], reverse=reverse)

        for position, (tid, _) in enumerate(team_values):
            if tid in target_set:
                # position 0 = best = 100th percentile
                percentile = round(((n - 1 - position) / max(n - 1, 1)) * 100, 1)
                ranks[tid][f"{stat_key}_RANK"] = percentile

    return ranks


def extract_standings_for_teams(standings_data: dict, team_ids: list[str]) -> dict[str, dict]:
    """
    Extract standings info for specific teams.

    Standings API response: { "leagueStandings": { "teams": [...] } }

    Returns:
        dict mapping team_id (str) -> { record, conf_rank, wins, losses, ... }
    """
    team_id_set = {str(tid) for tid in team_ids}
    result = {}

    # Navigate the standings structure
    league_standings = standings_data.get("leagueStandings", {})
    teams_list = league_standings.get("teams", [])

    for team in teams_list:
        tid = str(team.get("teamId", ""))
        if tid not in team_id_set:
            continue

        wins = team.get("wins", 0) or 0
        losses = team.get("losses", 0) or 0
        result[tid] = {
            "record": f"{wins}-{losses}",
            "conf_rank": team.get("playoffRank") or team.get("playoffSeeding"),
            "wins": wins,
            "losses": losses,
            "win_pct": team.get("winPct", 0),
            "home_record": team.get("home", ""),
            "road_record": team.get("road", ""),
            "last_10": team.get("l10", ""),
            "streak": team.get("currentStreakText", ""),
            "conference": team.get("conference", ""),
            "team_name": team.get("teamName", ""),
            "abbreviation": team.get("teamAbbreviation", ""),
        }

    return result
