const API_BASE = '/api';

async function fetchJSON(url) {
  const response = await fetch(`${API_BASE}${url}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }
  return response.json();
}

export function getStandings() {
  return fetchJSON('/standings');
}

export function getMatchup(team1Id, team2Id, seasonType = 'Regular Season') {
  const params = new URLSearchParams({
    team1_id: team1Id,
    team2_id: team2Id,
    season_type: seasonType,
  });
  return fetchJSON(`/matchup?${params}`);
}

export function getMatchupPlayers(team1Id, team2Id) {
  const params = new URLSearchParams({
    team1_id: team1Id,
    team2_id: team2Id,
  });
  return fetchJSON(`/matchup/players?${params}`);
}

export function getH2HStats(team1Id, team2Id) {
  const params = new URLSearchParams({
    team1_id: team1Id,
    team2_id: team2Id,
  });
  return fetchJSON(`/matchup/h2h-stats?${params}`);
}

export function getPlayoffBracket() {
  return fetchJSON('/playoff-bracket');
}

export function getH2HPlayers(team1Id, team2Id) {
  const params = new URLSearchParams({
    team1_id: team1Id,
    team2_id: team2Id,
  });
  return fetchJSON(`/matchup/h2h-players?${params}`);
}
