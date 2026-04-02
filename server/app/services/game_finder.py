from __future__ import annotations


def process_h2h_games(team1_data: dict, team2_data: dict, team1_id: str, team2_id: str) -> list[dict]:
    """
    Process H2H game data from both team perspectives and merge into unified game list.

    QueryTool game/team response format:
    { "teams": [ { "teamId": ..., "gameId": ..., "gameDate": ..., "gameOutcome": ...,
                   "teamScore": ..., "opponentScore": ..., "stats": {...} } ] }

    Returns:
        Sorted list of H2H game dicts with keys:
        game_id, date, team1_pts, team2_pts, team1_wl, team2_wl
    """
    team1_games = _extract_games(team1_data)
    team2_games = _extract_games(team2_data)

    # Index team2 games by gameId for matching
    team2_by_id: dict[str, dict] = {}
    for g in team2_games:
        gid = g.get("gameId", "")
        if gid:
            team2_by_id[gid] = g

    games = []
    seen = set()

    for g1 in team1_games:
        gid = g1.get("gameId", "")
        game_date = g1.get("gameDate", "")
        team1_pts = g1.get("teamScore")
        team1_wl = g1.get("gameOutcome")  # "W" or "L"

        t2 = team2_by_id.get(gid)
        team2_pts = t2.get("teamScore") if t2 else None
        team2_wl = t2.get("gameOutcome") if t2 else None

        games.append({
            "game_id": gid or "",
            "date": str(game_date) if game_date else "",
            "team1_pts": int(team1_pts) if team1_pts is not None else None,
            "team2_pts": int(team2_pts) if team2_pts is not None else None,
            "team1_wl": str(team1_wl) if team1_wl else None,
            "team2_wl": str(team2_wl) if team2_wl else None,
        })
        if gid:
            seen.add(gid)

    # Add any team2 games not matched
    for g2 in team2_games:
        gid = g2.get("gameId", "")
        if gid and gid not in seen:
            games.append({
                "game_id": gid,
                "date": str(g2.get("gameDate", "")),
                "team1_pts": None,
                "team2_pts": int(g2["teamScore"]) if g2.get("teamScore") is not None else None,
                "team1_wl": None,
                "team2_wl": str(g2["gameOutcome"]) if g2.get("gameOutcome") else None,
            })

    games.sort(key=lambda g: g.get("date", ""))
    return games


def _extract_games(data: dict) -> list[dict]:
    """Extract game records from querytool game/team response."""
    if not isinstance(data, dict):
        return []
    return data.get("teams", [])
