import teams from '../data/nba_teams.json';

/**
 * Get the secondary (dark-bg legible) color for a team.
 * Accepts a team ID (number) or abbreviation (string).
 */
export function getTeamColor(idOrAbbr) {
  const team =
    typeof idOrAbbr === 'number'
      ? teams.find((t) => t.id === idOrAbbr)
      : teams.find((t) => t.abbreviation === idOrAbbr);
  return team?.color2 || '#9aa3b2';
}
