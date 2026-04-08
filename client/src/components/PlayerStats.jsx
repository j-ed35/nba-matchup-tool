import { useState } from 'react';
import { getTeamColor } from '../utils/teamColors';

// Map column keys to ranking keys from the backend
const RANK_KEY_MAP = {
  PTS: 'PTS_RANK',
  REB: 'REB_RANK',
  AST: 'AST_RANK',
  STL: 'STL_RANK',
  BLK: 'BLK_RANK',
  FG_PCT: 'FG_PCT_RANK',
  FG3_PCT: 'FG3_PCT_RANK',
  PLUS_MINUS: 'PLUS_MINUS_RANK',
};

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const COLUMNS = [
  { key: 'player_name', label: 'Player', align: 'left' },
  { key: 'GP', label: 'GP', format: (v) => v != null ? Math.round(v) : '-' },
  { key: 'MIN', label: 'MIN', format: (v) => v?.toFixed(1) },
  { key: 'PTS', label: 'PTS', format: (v) => v?.toFixed(1) },
  { key: 'REB', label: 'REB', format: (v) => v?.toFixed(1) },
  { key: 'AST', label: 'AST', format: (v) => v?.toFixed(1) },
  { key: 'FG_PCT', label: 'FG%', format: (v) => v != null ? `${(v < 1 ? v * 100 : v).toFixed(1)}` : '-' },
  { key: 'FG3_PCT', label: '3P%', format: (v) => v != null ? `${(v < 1 ? v * 100 : v).toFixed(1)}` : '-' },
];

function PlayerTable({ players, teamColor, teamAbbr, subtitle, rankings }) {
  const [sortKey, setSortKey] = useState('MIN');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...(players || [])].sort((a, b) => {
    const av = a[sortKey] ?? -Infinity;
    const bv = b[sortKey] ?? -Infinity;
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: teamColor }}>
          {teamAbbr}
        </span>
        {subtitle && (
          <span className="text-[10px] text-[var(--text-muted)]">{subtitle}</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border-color)]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.key !== 'player_name' && handleSort(col.key)}
                  className={`pb-1.5 pr-3 font-medium text-[var(--text-muted)] whitespace-nowrap ${
                    col.align === 'left' ? 'text-left' : 'text-right'
                  } ${col.key !== 'player_name' ? 'cursor-pointer hover:text-[var(--text-secondary)]' : ''}`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-0.5 text-[10px]">{sortDir === 'desc' ? '\u25BC' : '\u25B2'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => {
              const playerRanks = rankings?.[String(player.player_id)] || {};
              return (
                <tr
                  key={player.player_id || i}
                  className="border-b border-[var(--border-color)]/20 hover:bg-white/[0.015] transition-colors"
                >
                  {COLUMNS.map((col) => {
                    const rankKey = RANK_KEY_MAP[col.key];
                    const rank = rankKey ? playerRanks[rankKey] : null;
                    const showRank = rank != null && rank <= 10;
                    const isFirst = rank === 1;

                    return (
                      <td
                        key={col.key}
                        className={`py-1 pr-3 tabular-nums ${
                          col.align === 'left' ? 'text-left text-[var(--text-secondary)]' : 'text-right text-[var(--text-muted)]'
                        }`}
                      >
                        <div className={col.align === 'left' ? '' : 'flex flex-col items-end'}>
                          <span>{col.format ? col.format(player[col.key]) : player[col.key] ?? '-'}</span>
                          {showRank && (
                            <span className={`text-[9px] leading-none ${isFirst ? 'font-bold text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                              {ordinal(rank)}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {(!players || players.length === 0) && (
              <tr>
                <td colSpan={COLUMNS.length} className="py-3 text-center text-[var(--text-muted)] text-[10px]">
                  No player data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PlayerStats({ players, matchup, mode = 'season', team1Color: t1c, team2Color: t2c, rankings }) {
  if (!players || !matchup) return null;

  const isH2H = mode === 'h2h';
  const rankingsMap = isH2H ? rankings?.rankings : null;

  const team1Abbr = matchup.team1.abbreviation;
  const team2Abbr = matchup.team2.abbreviation;
  const team1Color = t1c || getTeamColor(isH2H ? team1Abbr : matchup.team1.id);
  const team2Color = t2c || getTeamColor(isH2H ? team2Abbr : matchup.team2.id);

  return (
    <div className="py-4 border-t border-[var(--border-color)]">
      <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">
        {isH2H ? 'H2H Player Stats' : 'Player Stats'}
      </h4>
      <div className="flex gap-6 flex-col lg:flex-row">
        <PlayerTable
          players={players.team1_players}
          teamColor={team1Color}
          teamAbbr={team1Abbr}
          subtitle={isH2H ? `vs ${team2Abbr}` : null}
          rankings={rankingsMap}
        />
        <div className="hidden lg:block w-px bg-[var(--border-color)]" />
        <PlayerTable
          players={players.team2_players}
          teamColor={team2Color}
          teamAbbr={team2Abbr}
          subtitle={isH2H ? `vs ${team1Abbr}` : null}
          rankings={rankingsMap}
        />
      </div>
    </div>
  );
}
