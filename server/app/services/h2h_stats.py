from __future__ import annotations


LOWER_IS_BETTER = {"TOV", "PF", "DEF_RATING"}

# Map raw API stat keys to the keys the frontend expects
STAT_KEY_MAP = {
    "PTS_PG": "PTS",
    "REB_PG": "REB",
    "AST_PG": "AST",
    "STL_PG": "STL",
    "BLK_PG": "BLK",
    "TOV_PG": "TOV",
    "OREB_PG": "OREB",
    "DREB_PG": "DREB",
    "PF_PG": "PF",
    "FG_PCT_PG": "FG_PCT",
    "FG3_PCT_PG": "FG3_PCT",
    "FT_PCT_PG": "FT_PCT",
    "PLUS_MINUS_PG": "PLUS_MINUS",
    # Advanced stats (no _PG suffix)
    "OFF_RATING": "OFF_RATING",
    "DEF_RATING": "DEF_RATING",
    "NET_RATING": "NET_RATING",
    "PACE": "PACE",
    "TS_PCT": "TS_PCT",
    "EFG_PCT": "EFG_PCT",
    "GP": "GP",
}


def process_h2h_team_stats(base_data: dict, advanced_data: dict, team_id: str) -> dict:
    """
    Process querytool /season/team responses to extract a team's H2H stats and league-wide rankings.
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
            for raw_key, value in stats_obj.items():
                # Map to frontend-expected key, or keep as-is
                mapped_key = STAT_KEY_MAP.get(raw_key, raw_key)
                if not mapped_key.endswith("_RANK"):
                    all_teams[tid]["stats"][mapped_key] = value
                    if mapped_key == "GP" and value:
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
