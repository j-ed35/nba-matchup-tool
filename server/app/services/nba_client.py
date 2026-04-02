from __future__ import annotations

import httpx
from datetime import datetime
from app.config import Config


class NBAClient:
    """Client for the official NBA API (api.nba.com/v0)."""

    BASE_URL = "https://api.nba.com/v0"
    LEAGUE_ID = "00"

    def __init__(self):
        self.api_key = Config.NBA_API_KEY
        self.standings_key = Config.NBA_STANDINGS_KEY
        self.query_tool_key = Config.QUERY_TOOL_API_KEY
        self.stats_key = Config.STATS_API_KEY

    def _get_current_season(self) -> str:
        now = datetime.now()
        if now.month >= 10:
            return f"{now.year}-{str(now.year + 1)[-2:]}"
        return f"{now.year - 1}-{str(now.year)[-2:]}"

    def _stats_headers(self) -> dict:
        return {"X-NBA-Api-Key": self.stats_key}

    def _querytool_headers(self) -> dict:
        return {"X-NBA-Api-Key": self.query_tool_key}

    def _standings_headers(self) -> dict:
        return {"X-NBA-Api-Key": self.standings_key}

    async def get_team_stats(self, team_ids: list[str], season: str = None, per_mode: str = "PerGame", measure_type: str = "Base", season_type: str = "Regular Season") -> dict:
        season = season or self._get_current_season()
        url = f"{self.BASE_URL}/api/stats/team"
        params = {
            "leagueId": self.LEAGUE_ID, "season": season, "perMode": per_mode,
            "measureType": measure_type, "seasonType": season_type,
            "teamId": ",".join(str(tid) for tid in team_ids),
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self._stats_headers(), params=params, timeout=15)
            response.raise_for_status()
            return response.json()

    async def get_player_stats(self, team_id: str, season: str = None, per_mode: str = "PerGame", measure_type: str = "Base", season_type: str = "Regular Season") -> dict:
        season = season or self._get_current_season()
        url = f"{self.BASE_URL}/api/stats/player"
        params = {
            "leagueId": self.LEAGUE_ID, "season": season, "perMode": per_mode,
            "measureType": measure_type, "seasonType": season_type,
            "teamId": str(team_id),
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self._stats_headers(), params=params, timeout=15)
            response.raise_for_status()
            return response.json()

    async def get_standings(self, season: str = None, season_type: str = "Regular Season") -> dict:
        season = season or self._get_current_season()
        url = f"{self.BASE_URL}/api/standings/league"
        params = {"leagueId": self.LEAGUE_ID, "season": season, "seasonType": season_type}
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self._standings_headers(), params=params, timeout=10)
            response.raise_for_status()
            return response.json()

    async def get_h2h_games(self, team_id: str, opp_team_id: str, season: str = None, season_type: str = "Regular Season", measure_type: str = "Base") -> dict:
        season = season or self._get_current_season()
        url = f"{self.BASE_URL}/api/querytool/game/team"
        params = {
            "leagueId": self.LEAGUE_ID, "seasonYear": season, "seasonType": season_type,
            "measureType": measure_type, "TeamId": team_id, "oppTeamId": opp_team_id,
            "gameGrouping": "None", "perMode": "Totals",
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self._querytool_headers(), params=params, timeout=15)
            response.raise_for_status()
            return response.json()

    async def get_season_team_vs_opponent(self, opp_team_id: str, season: str = None,
                                          per_mode: str = "PerGame", measure_type: str = "Base",
                                          season_type: str = "Regular Season") -> dict:
        """Get ALL teams' season stats filtered to games vs a specific opponent.
        Returns all 30 teams — used to compute league-wide rankings."""
        season = season or self._get_current_season()
        url = f"{self.BASE_URL}/api/querytool/season/team"
        params = {
            "leagueId": self.LEAGUE_ID, "SeasonYear": season, "SeasonType": season_type,
            "PerMode": per_mode, "Grouping": "None", "MeasureType": measure_type,
            "oppTeamId": str(opp_team_id),
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self._querytool_headers(), params=params, timeout=15)
            response.raise_for_status()
            return response.json()

    async def get_season_player_vs_opponent(self, team_id: str, opp_team_id: str,
                                             season: str = None, per_mode: str = "PerGame",
                                             measure_type: str = "Base",
                                             season_type: str = "Regular Season") -> dict:
        """Get player stats for a specific team, filtered to games vs a specific opponent."""
        season = season or self._get_current_season()
        url = f"{self.BASE_URL}/api/querytool/season/player"
        params = {
            "leagueId": self.LEAGUE_ID, "SeasonYear": season, "SeasonType": season_type,
            "PerMode": per_mode, "Grouping": "None", "TeamGrouping": "N",
            "MeasureType": measure_type, "TeamId": str(team_id), "oppTeamId": str(opp_team_id),
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self._querytool_headers(), params=params, timeout=15)
            response.raise_for_status()
            return response.json()

    async def get_h2h_player_games(self, team_id: str, opp_team_id: str, season: str = None, season_type: str = "Regular Season", measure_type: str = "Base") -> dict:
        season = season or self._get_current_season()
        url = f"{self.BASE_URL}/api/querytool/game/player"
        params = {
            "leagueId": self.LEAGUE_ID, "seasonYear": season, "seasonType": season_type,
            "measureType": measure_type, "TeamId": team_id, "oppTeamId": opp_team_id,
            "gameGrouping": "None", "perMode": "Totals",
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self._querytool_headers(), params=params, timeout=15)
            response.raise_for_status()
            return response.json()
