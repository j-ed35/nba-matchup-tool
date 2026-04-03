import { useState } from 'react';
import { statDisplayName, LOWER_IS_BETTER } from '../utils/formatting';
import teams from '../data/nba_teams.json';

const PRESETS = {
  'Overview': ['PTS', 'REB', 'AST', 'STL', 'BLK', 'FG_PCT'],
  'Shooting': ['FG_PCT', 'FG3_PCT', 'FT_PCT', 'TS_PCT', 'EFG_PCT', 'PTS'],
  'Advanced': ['OFF_RATING', 'DEF_RATING', 'NET_RATING', 'PACE', 'TS_PCT', 'EFG_PCT'],
  'Defense': ['STL', 'BLK', 'DREB', 'DEF_RATING', 'OPP_PTS_PAINT', 'OPP_PTS_FB'],
};

// Normalize a stat value to 0-1 range for the chart.
// Uses league-reasonable min/max bounds per stat.
const STAT_RANGES = {
  PTS: [95, 125], REB: [38, 50], AST: [20, 32], STL: [5, 11], BLK: [3, 7],
  TOV: [10, 18], FG_PCT: [0.43, 0.50], FG3_PCT: [0.32, 0.40], FT_PCT: [0.72, 0.84],
  TS_PCT: [0.54, 0.62], EFG_PCT: [0.50, 0.58],
  OFF_RATING: [108, 120], DEF_RATING: [108, 120], NET_RATING: [-8, 10], PACE: [96, 104],
  OREB: [8, 14], DREB: [30, 38], PF: [17, 24],
  OPP_PTS_PAINT: [42, 56], OPP_PTS_FB: [10, 18], OPP_PTS_OFF_TOV: [14, 22], OPP_PTS2ND_CHANCE: [10, 16],
  PTS_PAINT: [42, 56], PTS_FB: [10, 18], PTS_OFF_TOV: [14, 22], PTS2ND_CHANCE: [10, 16],
};

function normalize(value, statKey) {
  if (value == null) return 0;
  const [min, max] = STAT_RANGES[statKey] || [0, value * 2 || 1];
  let norm = (value - min) / (max - min);
  // Invert stats where lower is better so "better" is always outward
  if (LOWER_IS_BETTER.has(statKey)) norm = 1 - norm;
  return Math.max(0.05, Math.min(1, norm));
}

function polarToXY(angle, radius, cx, cy) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export default function RadarChart({ matchup, h2hStats, mode = 'season' }) {
  const [preset, setPreset] = useState('Overview');
  const isH2H = mode === 'h2h';
  const data = isH2H ? h2hStats : matchup;

  if (!data) return null;

  const team1Abbr = data.team1.abbreviation;
  const team2Abbr = data.team2.abbreviation;
  const team1Info = isH2H
    ? teams.find((t) => t.abbreviation === team1Abbr)
    : teams.find((t) => t.id === data.team1.id);
  const team2Info = isH2H
    ? teams.find((t) => t.abbreviation === team2Abbr)
    : teams.find((t) => t.id === data.team2.id);

  const team1Color = team1Info?.color || '#3b82f6';
  const team2Color = team2Info?.color || '#ef4444';
  const team1Stats = data.team1.stats;
  const team2Stats = data.team2.stats;

  const stats = PRESETS[preset] || PRESETS['Overview'];
  const n = stats.length;
  const cx = 140;
  const cy = 140;
  const maxR = 110;

  const angleStep = 360 / n;

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Build polygon points
  const buildPolygon = (teamStats) =>
    stats
      .map((key, i) => {
        const val = normalize(teamStats?.[key], key);
        const { x, y } = polarToXY(i * angleStep, val * maxR, cx, cy);
        return `${x},${y}`;
      })
      .join(' ');

  const poly1 = buildPolygon(team1Stats);
  const poly2 = buildPolygon(team2Stats);

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
              onClick={() => setPreset(p)}
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
      </div>

      <svg viewBox="0 0 280 280" className="w-full max-w-[280px] mx-auto">
        {/* Grid rings */}
        {rings.map((r) => (
          <polygon
            key={r}
            points={stats
              .map((_, i) => {
                const { x, y } = polarToXY(i * angleStep, r * maxR, cx, cy);
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={r === 1 ? 0.8 : 0.4}
          />
        ))}

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

        {/* Labels */}
        {stats.map((key, i) => {
          const { x, y } = polarToXY(i * angleStep, maxR + 16, cx, cy);
          return (
            <text
              key={key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--text-muted)"
              fontSize={9}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {statDisplayName(key).replace(/ /g, '\u00A0')}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
