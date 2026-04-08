from __future__ import annotations


def process_boxscore(raw: dict, game_id: str) -> dict:
    """Process raw box score response into a compact game summary."""
    home = raw.get("homeTeam", {})
    away = raw.get("awayTeam", {})

    home_stats = home.get("statistics", {})
    away_stats = away.get("statistics", {})

    def extract_team(team_data: dict) -> dict:
        stats = team_data.get("statistics", {})
        players = team_data.get("players", [])

        # Filter to players who actually played, sort by points desc
        played = [p for p in players if p.get("played") == "1" or p.get("played") is True]
        played.sort(key=lambda p: p.get("statistics", {}).get("points", 0), reverse=True)

        top_players = []
        for p in played[:2]:
            ps = p.get("statistics", {})
            entry = {
                "name": p.get("name", ""),
                "pts": int(ps.get("points", 0)),
                "reb": int(ps.get("reboundsTotal", 0)),
                "ast": int(ps.get("assists", 0)),
                "fgm": int(ps.get("fieldGoalsMade", 0)),
                "fga": int(ps.get("fieldGoalsAttempted", 0)),
                "min": ps.get("minutes", "0"),
            }
            fg3m = int(ps.get("threePointersMade", 0))
            if fg3m > 0:
                entry["fg3m"] = fg3m
            top_players.append(entry)

        fgm = int(stats.get("fieldGoalsMade", 0))
        fga = int(stats.get("fieldGoalsAttempted", 0))
        fg3m = int(stats.get("threePointersMade", 0))
        fg3a = int(stats.get("threePointersAttempted", 0))

        return {
            "tricode": team_data.get("teamTricode", ""),
            "team_stats": {
                "fgm": fgm,
                "fga": fga,
                "fg_pct": round(fgm / fga * 100, 1) if fga > 0 else 0.0,
                "fg3m": fg3m,
                "fg3a": fg3a,
                "fg3_pct": round(fg3m / fg3a * 100, 1) if fg3a > 0 else 0.0,
                "reb": int(stats.get("reboundsTotal", stats.get("reb", 0))),
                "ast": int(stats.get("assists", 0)),
                "stl": int(stats.get("steals", 0)),
                "blk": int(stats.get("blocks", 0)),
                "bench_pts": int(stats.get("benchPoints", 0)),
                "paint_pts": int(stats.get("pointsInThePaint", stats.get("ptsPaint", 0))),
                "pts_2nd_chance": int(stats.get("pts2ndChance", stats.get("secondChancePoints", 0))),
                "pts_off_tov": int(stats.get("pointsFromTurnovers", stats.get("ptsOffTurnovers", 0))),
            },
            "top_players": top_players,
        }

    home_id = str(home.get("teamId", ""))
    away_id = str(away.get("teamId", ""))

    return {
        "game_id": game_id,
        "lead_changes": int(home_stats.get("leadChanges", away_stats.get("leadChanges", 0))),
        "times_tied": int(home_stats.get("timesTied", away_stats.get("timesTied", 0))),
        "biggest_lead_home": int(home_stats.get("biggestLead", 0)),
        "biggest_lead_away": int(away_stats.get("biggestLead", 0)),
        "teams": {
            home_id: extract_team(home),
            away_id: extract_team(away),
        },
    }
