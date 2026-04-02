import { useState } from 'react';
import teams from '../data/nba_teams.json';

const COLUMNS = [
  { key: 'player_name', label: 'Player', align: 'left' },
  { key: 'MIN', label: 'MPG', format: (v) => v?.toFixed(1) },
  { key: 'PTS', label: 'PPG', format: (v) => v?.toFixed(1) },
  { key: 'REB', label: 'RPG', format: (v) => v?.toFixed(1) },
  { key: 'AST', label: 'APG', format: (v) => v?.toFixed(1) },
  { key: 'FG_PCT', label: 'FG%', format: (v) => v != null ? `${(v < 1 ? v * 100 : v).toFixed(1)}` : '-' },
  { key: 'FG3_PCT', label: '3P%', format: (v) => v != null ? `${(v < 1 ? v * 100 : v).toFixed(1)}` : '-' },
];

function PlayerTable({ players, teamColor, teamAbbr }) {
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
      <h4 className="text-sm font-bold mb-3 px-1" style={{ color: teamColor }}>
        {teamAbbr}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border-color)]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.key !== 'player_name' && handleSort(col.key)}
                  className={`py-2 px-2 font-medium text-gray-500 whitespace-nowrap ${
                    col.align === 'left' ? 'text-left' : 'text-right'
                  } ${col.key !== 'player_name' ? 'cursor-pointer hover:text-gray-300' : ''}`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-0.5">{sortDir === 'desc' ? '\u25BC' : '\u25B2'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => (
              <tr
                key={player.player_id || i}
                className="border-b border-[var(--border-color)]/20 hover:bg-white/[0.02]"
              >
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`py-2 px-2 tabular-nums ${
                      col.align === 'left' ? 'text-left text-gray-200' : 'text-right text-gray-400'
                    }`}
                  >
                    {col.format ? col.format(player[col.key]) : player[col.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
            {(!players || players.length === 0) && (
              <tr>
                <td colSpan={COLUMNS.length} className="py-4 text-center text-gray-600">
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

export default function PlayerStats({ players, matchup }) {
  if (!players || !matchup) return null;

  const team1Info = teams.find((t) => t.id === matchup.team1.id);
  const team2Info = teams.find((t) => t.id === matchup.team2.id);

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">Player Stats</h3>
      <div className="flex gap-6 flex-col lg:flex-row">
        <PlayerTable
          players={players.team1_players}
          teamColor={team1Info?.color || '#3b82f6'}
          teamAbbr={matchup.team1.abbreviation}
        />
        <div className="hidden lg:block w-px bg-[var(--border-color)]" />
        <PlayerTable
          players={players.team2_players}
          teamColor={team2Info?.color || '#ef4444'}
          teamAbbr={matchup.team2.abbreviation}
        />
      </div>
    </div>
  );
}
