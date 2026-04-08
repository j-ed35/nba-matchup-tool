from __future__ import annotations


# Querytool stat keys to rank (higher is better for all except noted)
RANK_STATS = {
    "PTS_PG": "PTS_RANK",
    "REB_PG": "REB_RANK",
    "AST_PG": "AST_RANK",
    "STL_PG": "STL_RANK",
    "BLK_PG": "BLK_RANK",
    "FG_PCT": "FG_PCT_RANK",
    "FG3_PCT": "FG3_PCT_RANK",
    "PLUS_MINUS_PG": "PLUS_MINUS_RANK",
}

MIN_GP = 2


def compute_player_rankings(raw_data: dict, team_ids: set[str]) -> dict:
    """Compute ordinal rankings for players on the given teams among all players league-wide.

    Args:
        raw_data: Response from get_all_players_vs_opponent (querytool season/player).
        team_ids: Set of team IDs whose players we want rankings for.

    Returns:
        Dict keyed by player_id -> { "PTS_RANK": N, "REB_RANK": N, ... }
    """
    players = raw_data.get("players", [])
    if not players:
        return {}

    # Filter to players with minimum GP
    qualified = []
    for p in players:
        stats = p.get("stats", {})
        gp = stats.get("GP", 0)
        if gp is not None and gp >= MIN_GP:
            qualified.append(p)

    if not qualified:
        return {}

    # For each stat, sort all qualified players and assign ranks
    # Then extract ranks only for players on the target teams
    target_player_ids = set()
    for p in qualified:
        pid = str(p.get("playerId", ""))
        tid = str(p.get("teamId", ""))
        if tid in team_ids:
            target_player_ids.add(pid)

    rankings = {pid: {} for pid in target_player_ids}

    for stat_key, rank_key in RANK_STATS.items():
        # Sort descending (higher is better)
        sorted_players = sorted(
            qualified,
            key=lambda p: p.get("stats", {}).get(stat_key) or 0,
            reverse=True,
        )

        for rank, p in enumerate(sorted_players, start=1):
            pid = str(p.get("playerId", ""))
            if pid in target_player_ids:
                rankings[pid][rank_key] = rank

    return rankings
