const PCT_STATS = new Set([
  'W_PCT', 'FG_PCT', 'FG3_PCT', 'FT_PCT',
  'OPP_FG_PCT', 'OPP_FG3_PCT', 'OPP_EFG_PCT', 'OPP_FTA_RATE',
  'EFG_PCT', 'TS_PCT', 'AST_PCT', 'OREB_PCT', 'DREB_PCT', 'REB_PCT',
  'TM_TOV_PCT', 'OPP_TOV_PCT', 'USG_PCT',
]);

const INT_STATS = new Set(['W', 'L', 'GP']);

// Stats where lower is better
export const LOWER_IS_BETTER = new Set([
  'TOV', 'PF', 'DEF_RATING', 'L',
  'OPP_PTS_OFF_TOV', 'OPP_PTS2ND_CHANCE', 'OPP_PTS_FB', 'OPP_PTS_PAINT',
]);

export function formatStat(value, statKey) {
  if (value == null) return '-';
  if (PCT_STATS.has(statKey)) {
    const pct = value < 1 ? value * 100 : value;
    return `${pct.toFixed(1)}%`;
  }
  if (INT_STATS.has(statKey)) {
    return Math.round(value).toString();
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  }
  return String(value);
}

export function formatRank(rank) {
  if (rank == null) return '';
  return `#${rank}`;
}

export function formatOrdinal(n) {
  if (n == null) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function statDisplayName(key) {
  const names = {
    W: 'Wins', L: 'Losses', W_PCT: 'Win %',
    PTS: 'Points', REB: 'Rebounds', AST: 'Assists',
    STL: 'Steals', BLK: 'Blocks', TOV: 'Turnovers',
    FG_PCT: 'FG%', FG3_PCT: '3P%', FT_PCT: 'FT%',
    OREB: 'Off Reb', DREB: 'Def Reb', PF: 'Fouls',
    OFF_RATING: 'Off Rating', DEF_RATING: 'Def Rating',
    NET_RATING: 'Net Rating', PACE: 'Pace',
    TS_PCT: 'True Shooting %', EFG_PCT: 'Eff FG%',
    PTS_OFF_TOV: 'Pts Off TOV', PTS2ND_CHANCE: '2nd Chance Pts',
    PTS_FB: 'Fastbreak Pts', PTS_PAINT: 'Paint Pts',
    OPP_PTS_OFF_TOV: 'Opp Pts Off TOV', OPP_PTS2ND_CHANCE: 'Opp 2nd Chance',
    OPP_PTS_FB: 'Opp Fastbreak', OPP_PTS_PAINT: 'Opp Paint Pts',
  };
  return names[key] || key.replace(/_/g, ' ');
}
