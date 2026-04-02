from __future__ import annotations

import re


LOWER_IS_BETTER = {"TOV", "PF", "DEF_RATING"}


def _camel_to_upper_snake(name: str) -> str:
    s1 = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1_\2', name)
    s2 = re.sub(r'([a-z\d])([A-Z])', r'\1_\2', s1)
    return s2.upper()


def process_h2h_team_stats(base_data: dict, advanced_data: dict, team_id: str) -> dict:
    """
    Process querytool /season/team responses to extract a team's H2H stats and league-wide rankings.

    Args:
        base_data: Response from querytool with MeasureType=Base (all teams vs opponent)
        advanced_data: Response from querytool with MeasureType=Advanced (all teams vs opponent)
        team_id: The team whose stats and ranks we want

    Returns:
        {"stats": {...}, "ranks": {...}, "gamesPlayed": int, "abbreviation": str}
    """
    all_teams: dict[str, dict] = {}

    for raw_data in [base_data, advanced_data]:
        teams_list = raw_data.get("teams", []) if isinstance(raw_data, dict) else []
        for team_obj in teams_list:
            tid = str(team_obj.get("teamId", ""))
            if not tid:
                continue

            if tid not in all_teams:
                all_teams[tid] = {
                    "stats": {},
                    "abbreviation": team_obj.get("teamAbbreviation", ""),
                    "gp": 0,
                }

            stats_obj = team_obj.get("stats", {})
            for key, value in stats_obj.items():
                snake_key = _camel_to_upper_snake(key)
                if not snake_key.endswith("_RANK"):
                    all_teams[tid]["stats"][snake_key] = value
                    if snake_key == "GP" and value:
                        try:
                            all_teams[tid]["gp"] = int(value)
                        except (ValueError, TypeError):
                            pass

    # Filter to teams that have actually played games vs the opponent
    active_teams = {tid: data for tid, data in all_teams.items() if data["gp"] > 0}

    target_tid = str(team_id)
    target = active_teams.get(target_tid, {"stats": {}, "abbreviation": "", "gp": 0})

    # Compute rankings for each stat
    ranks = {}
    stat_keys = set(target["stats"].keys()) - {"GP"}

    for stat_key in stat_keys:
        values = []
        for tid, data in active_teams.items():
            val = data["stats"].get(stat_key)
            if val is not None:
                try:
                    values.append((tid, float(val)))
                except (ValueError, TypeError):
                    continue

        if not values:
            continue

        reverse = stat_key not in LOWER_IS_BETTER
        values.sort(key=lambda x: x[1], reverse=reverse)

        for i, (tid, _) in enumerate(values):
            if tid == target_tid:
                ranks[stat_key] = i + 1
                break

    return {
        "stats": target["stats"],
        "ranks": ranks,
        "gamesPlayed": target["gp"],
        "abbreviation": target["abbreviation"],
    }
