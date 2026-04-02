from __future__ import annotations


def process_player_stats(raw_data: dict, team_ids: list[str], top_n: int = 10) -> dict[str, list[dict]]:
    """
    Process player stats response for a single team.

    Stats API player response format:
    { "players": [ { "personId": ..., "name": ..., "stats": { "gp": ..., "min": ..., ... } } ] }

    Since we query per team, all players belong to team_ids[0].

    Returns:
        dict mapping team_id (str) -> list of player stat dicts
    """
    tid = str(team_ids[0]) if team_ids else ""
    players_list = raw_data.get("players", []) if isinstance(raw_data, dict) else []

    result = []
    for player_obj in players_list:
        stats = player_obj.get("stats", {})
        player = {
            "player_id": int(player_obj.get("personId", 0)),
            "player_name": player_obj.get("name", ""),
            "team_id": int(tid) if tid else 0,
            "team_abbreviation": "",
            "GP": int(stats.get("gp", 0) or 0),
            "MIN": float(stats.get("min", 0) or 0),
            "PTS": float(stats.get("pts", 0) or 0),
            "REB": float(stats.get("reb", 0) or 0),
            "AST": float(stats.get("ast", 0) or 0),
            "STL": float(stats.get("stl", 0) or 0),
            "BLK": float(stats.get("blk", 0) or 0),
            "TOV": float(stats.get("tov", 0) or 0),
            "FG_PCT": _safe_float(stats.get("fgPct")),
            "FG3_PCT": _safe_float(stats.get("fg3Pct")),
            "FT_PCT": _safe_float(stats.get("ftPct")),
            "PLUS_MINUS": _safe_float(stats.get("plusMinus")),
        }
        result.append(player)

    result.sort(key=lambda p: p["MIN"], reverse=True)
    return {tid: result[:top_n]}


def _safe_float(val):
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None
