from pydantic import BaseModel
from typing import Optional


class TeamStats(BaseModel):
    id: int
    abbreviation: str
    stats: dict
    stats_ranks: dict
    record: str
    conf_rank: Optional[int] = None


class H2HGame(BaseModel):
    game_id: str
    date: str
    team1_pts: Optional[int] = None
    team2_pts: Optional[int] = None
    team1_wl: Optional[str] = None
    team2_wl: Optional[str] = None


class MatchupResponse(BaseModel):
    team1: TeamStats
    team2: TeamStats
    h2h_games: list[H2HGame]


class PlayerStatsResponse(BaseModel):
    team1_players: list[dict]
    team2_players: list[dict]


class H2HTeamStats(BaseModel):
    stats: dict
    ranks: dict
    gamesPlayed: int
    abbreviation: str = ""


class H2HStatsResponse(BaseModel):
    team1: H2HTeamStats
    team2: H2HTeamStats
