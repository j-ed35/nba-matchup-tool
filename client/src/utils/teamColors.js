import teams from '../data/nba_teams.json';

/**
 * Get the secondary (dark-bg legible) color for a team.
 * Accepts a team ID (number) or abbreviation (string).
 */
export function getTeamColor(idOrAbbr) {
  const team = findTeam(idOrAbbr);
  return team?.color2 || '#9aa3b2';
}

/**
 * Get both primary and secondary colors for a team.
 */
export function getTeamColors(idOrAbbr) {
  const team = findTeam(idOrAbbr);
  return { primary: team?.color || '#9aa3b2', secondary: team?.color2 || '#9aa3b2' };
}

function findTeam(idOrAbbr) {
  return typeof idOrAbbr === 'number'
    ? teams.find((t) => t.id === idOrAbbr)
    : teams.find((t) => t.abbreviation === idOrAbbr);
}
