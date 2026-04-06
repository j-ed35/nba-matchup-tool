import { useState } from 'react';
import { statDisplayName } from '../utils/formatting';
import { getTeamColor } from '../utils/teamColors';

const PRESETS = {
  Overview: ['PTS', 'REB', 'AST', 'STL', 'BLK', 'DEF_RATING'],
  Shooting: ['FG_PCT', 'FG3_PCT', 'FT_PCT', 'TS_PCT', 'EFG_PCT', 'PTS'],
  Advanced: ['OFF_RATING', 'DEF_RATING', 'NET_RATING', 'PACE', 'TS_PCT', 'EFG_PCT'],
  Defense: ['STL', 'BLK', 'DREB', 'DEF_RATING', 'OPP_PTS_PAINT', 'OPP_PTS_FB'],
};

const ALL_STATS = {
  Overview: ['PTS', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'OREB', 'DREB', 'PF', 'DEF_RATING', 'OFF_RATING', 'NET_RATING'],
  Shooting: ['FG_PCT', 'FG3_PCT', 'FT_PCT', 'TS_PCT', 'EFG_PCT', 'PTS', 'PTS_PAINT', 'PTS_FB'],
  Advanced: ['OFF_RATING', 'DEF_RATING', 'NET_RATING', 'PACE', 'TS_PCT', 'EFG_PCT', 'PTS_OFF_TOV', 'PTS2ND_CHANCE'],
  Defense: ['STL', 'BLK', 'DREB', 'DEF_RATING', 'OPP_PTS_PAINT', 'OPP_PTS_FB', 'OPP_PTS_OFF_TOV', 'OPP_PTS2ND_CHANCE'],
};

/** Convert a 1-30 rank to a 0-100 percentile (rank 1 = 100, rank 30 = 0). */
function rankToPercentile(rank) {
  if (rank == null) return 50;
  return ((30 - rank) / 29) * 100;
}

function polarToXY(angle, radius, cx, cy) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export default function RadarChart({ matchup, h2hStats, mode = 'season' }) {
  const [preset, setPreset] = useState('Overview');
  const [selectedStats, setSelectedStats] = useState(PRESETS['Overview']);

  const isH2H = mode === 'h2h';
  const data = isH2H ? h2hStats : matchup;
  // Always use season matchup for ranks (league-wide percentiles)
  const rankSource = matchup;

  if (!data) return null;

  const team1Abbr = data.team1.abbreviation;
  const team2Abbr = data.team2.abbreviation;
  const team1Color = getTeamColor(
    isH2H ? team1Abbr : data.team1.id
  );
  const team2Color = getTeamColor(
    isH2H ? team2Abbr : data.team2.id
  );

  // Get rank data from season matchup
  const team1Ranks = rankSource?.team1?.stats_ranks;
  const team2Ranks = rankSource?.team2?.stats_ranks;

  const stats = selectedStats.length >= 3 ? selectedStats : PRESETS[preset];
  const n = stats.length;
  const cx = 150;
  const cy = 150;
  const maxR = 115;
  const angleStep = 360 / n;
  const rings = [25, 50, 75, 100];

  const getPercentile = (teamRanks, statKey) => {
    if (!teamRanks) return 50;
    const rank = teamRanks[`${statKey}_RANK`];
    if (rank == null) return 50;
    // For LOWER_IS_BETTER stats, rank 1 means lowest value which is best,
    // so the rank already reflects "best = 1". Convert directly.
    return rankToPercentile(rank);
  };

  const buildPolygon = (teamRanks) =>
    stats
      .map((key, i) => {
        const pct = getPercentile(teamRanks, key);
        const r = (pct / 100) * maxR;
        const { x, y } = polarToXY(i * angleStep, Math.max(r, maxR * 0.03), cx, cy);
        return `${x},${y}`;
      })
      .join(' ');

  const poly1 = buildPolygon(team1Ranks);
  const poly2 = buildPolygon(team2Ranks);

  const handlePreset = (p) => {
    setPreset(p);
    setSelectedStats(PRESETS[p]);
  };

  const toggleStat = (stat) => {
    setSelectedStats((prev) => {
      if (prev.includes(stat)) {
        if (prev.length <= 3) return prev; // minimum 3 axes
        return prev.filter((s) => s !== stat);
      }
      return [...prev, stat];
    });
  };

  const availableStats = ALL_STATS[preset] || ALL_STATS['Overview'];

  return (
    <div className="py-4 border-t border-[var(--border-color)]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">
          Comparison
        </h4>
        <div className="flex gap-1">
          {Object.keys(PRESETS).map((p) => (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                preset === p
                  ? 'bg-[var(--border-color)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-2 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: team1Color }} />
          <span className="text-[10px] font-medium" style={{ color: team1Color }}>{team1Abbr}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: team2Color }} />
          <span className="text-[10px] font-medium" style={{ color: team2Color }}>{team2Abbr}</span>
        </div>
        <span className="text-[9px] text-[var(--text-muted)]">Percentile rank (0–100)</span>
      </div>

      <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
        {/* Grid rings */}
        {rings.map((pct) => {
          const r = (pct / 100) * maxR;
          return (
            <g key={pct}>
              <polygon
                points={stats
                  .map((_, i) => {
                    const { x, y } = polarToXY(i * angleStep, r, cx, cy);
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="var(--border-color)"
                strokeWidth={pct === 100 ? 0.8 : 0.4}
              />
              {/* Ring label */}
              <text
                x={cx + 3}
                y={cy - r + 1}
                fill="var(--text-muted)"
                fontSize={7}
                opacity={0.5}
              >
                {pct}
              </text>
            </g>
          );
        })}

        {/* Axis lines */}
        {stats.map((_, i) => {
          const { x, y } = polarToXY(i * angleStep, maxR, cx, cy);
          return (
            <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border-color)" strokeWidth={0.4} />
          );
        })}

        {/* Team 1 polygon */}
        <polygon points={poly1} fill={team1Color} fillOpacity={0.15} stroke={team1Color} strokeWidth={1.5} />

        {/* Team 2 polygon */}
        <polygon points={poly2} fill={team2Color} fillOpacity={0.15} stroke={team2Color} strokeWidth={1.5} />

        {/* Axis labels */}
        {stats.map((key, i) => {
          const { x, y } = polarToXY(i * angleStep, maxR + 18, cx, cy);
          return (
            <text
              key={key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--text-muted)"
              fontSize={8}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {statDisplayName(key).replace(/ /g, '\u00A0')}
            </text>
          );
        })}
      </svg>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-1 mt-3 justify-center">
        {availableStats.map((stat) => {
          const active = selectedStats.includes(stat);
          return (
            <button
              key={stat}
              onClick={() => toggleStat(stat)}
              className={`px-2 py-0.5 text-[9px] font-medium rounded-full transition-colors cursor-pointer border ${
                active
                  ? 'bg-[var(--border-color)] text-[var(--text-primary)] border-[var(--text-muted)]'
                  : 'text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
              }`}
            >
              {statDisplayName(stat)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
