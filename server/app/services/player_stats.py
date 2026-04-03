from __future__ import annotations


def process_player_stats(raw_data: dict, team_ids: list[str], top_n: int = 10) -> dict[str, list[dict]]:
    """
    Process player stats response from either the Stats API or the Querytool API.

    Stats API format:
    { "players": [ { "personId": ..., "name": ..., "stats": { "gp": ..., "min": ..., ... } } ] }

    Querytool API format:
    { "players": [ { "playerId": ..., "name": ..., "stats": { "GP": 4.0, "MIN_PG": 31.6, "PTS_PG": 14.0, ... } } ] }
    """
    tid = str(team_ids[0]) if team_ids else ""
    players_list = raw_data.get("players", []) if isinstance(raw_data, dict) else []

    result = []
    for player_obj in players_list:
        stats = player_obj.get("stats", {})

        # Support both personId (Stats API) and playerId (Querytool API)
        player_id = player_obj.get("personId") or player_obj.get("playerId", 0)

        player = {
            "player_id": int(player_id),
            "player_name": player_obj.get("name", ""),
            "team_id": int(tid) if tid else 0,
            "team_abbreviation": player_obj.get("teamAbbreviation", ""),
            "GP": int(_get_stat(stats, "GP", "gp") or 0),
            "MIN": float(_get_stat(stats, "MIN_PG", "min") or 0),
            "PTS": float(_get_stat(stats, "PTS_PG", "pts") or 0),
            "REB": float(_get_stat(stats, "REB_PG", "reb") or 0),
            "AST": float(_get_stat(stats, "AST_PG", "ast") or 0),
            "STL": float(_get_stat(stats, "STL_PG", "stl") or 0),
            "BLK": float(_get_stat(stats, "BLK_PG", "blk") or 0),
            "TOV": float(_get_stat(stats, "TOV_PG", "tov") or 0),
            "FG_PCT": _safe_float(_get_stat(stats, "FG_PCT", "fgPct")),
            "FG3_PCT": _safe_float(_get_stat(stats, "FG3_PCT", "fg3Pct")),
            "FT_PCT": _safe_float(_get_stat(stats, "FT_PCT", "ftPct")),
            "PLUS_MINUS": _safe_float(_get_stat(stats, "PLUS_MINUS_PG", "plusMinus")),
        }
        result.append(player)

    result.sort(key=lambda p: p["MIN"], reverse=True)
    return {tid: result[:top_n]}


def _get_stat(stats: dict, *keys):
    """Try multiple keys and return the first non-None value."""
    for key in keys:
        val = stats.get(key)
        if val is not None:
            return val
    return None


def _safe_float(val):
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None
