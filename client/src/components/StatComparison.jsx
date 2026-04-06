import { useState } from 'react';
import { formatStat, formatRank, formatOrdinal, statDisplayName, LOWER_IS_BETTER } from '../utils/formatting';
import { getTeamColor } from '../utils/teamColors';

const STAT_SECTIONS = [
  { title: 'Record', stats: ['W', 'L', 'W_PCT'] },
  { title: 'Base', stats: ['PTS', 'REB', 'AST', 'STL', 'BLK', 'TOV'] },
  { title: 'Shooting', stats: ['FG_PCT', 'FG3_PCT', 'FT_PCT'] },
  { title: 'REB & Fouls', stats: ['OREB', 'DREB', 'PF'] },
  { title: 'Advanced', stats: ['OFF_RATING', 'DEF_RATING', 'NET_RATING', 'PACE'] },
  { title: 'Misc', stats: ['PTS_OFF_TOV', 'PTS2ND_CHANCE', 'PTS_FB', 'PTS_PAINT'] },
  { title: 'Opponent', stats: ['OPP_PTS_OFF_TOV', 'OPP_PTS2ND_CHANCE', 'OPP_PTS_FB', 'OPP_PTS_PAINT'] },
];

const H2H_STAT_SECTIONS = [
  { title: 'Base', stats: ['PTS', 'REB', 'AST', 'STL', 'BLK', 'TOV'] },
  { title: 'Shooting', stats: ['FG_PCT', 'FG3_PCT', 'FT_PCT'] },
  { title: 'REB & Fouls', stats: ['OREB', 'DREB', 'PF'] },
  { title: 'Advanced', stats: ['OFF_RATING', 'DEF_RATING', 'NET_RATING', 'PACE', 'TS_PCT', 'EFG_PCT'] },
];

function isBetter(val1, val2, statKey) {
  if (val1 == null || val2 == null) return false;
  if (LOWER_IS_BETTER.has(statKey)) return val1 < val2;
  return val1 > val2;
}

function StatRow({ statKey, team1Stats, team2Stats, team1Ranks, team2Ranks, team1Color, team2Color, h2hMode }) {
  const val1 = team1Stats?.[statKey];
  const val2 = team2Stats?.[statKey];
  const t1Better = isBetter(val1, val2, statKey);
  const t2Better = isBetter(val2, val1, statKey);

  const rank1 = h2hMode ? team1Ranks?.[statKey] : team1Ranks?.[`${statKey}_RANK`];
  const rank2 = h2hMode ? team2Ranks?.[statKey] : team2Ranks?.[`${statKey}_RANK`];

  return (
    <tr className="border-b border-[var(--border-color)]/30 hover:bg-white/[0.015] transition-colors">
      <td className="py-1.5 pr-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
        {statDisplayName(statKey)}
      </td>
      <td className="py-1.5 px-2 text-right tabular-nums w-12">
        {rank1 != null && (
          <span className="text-[10px] text-[var(--text-muted)]">
            {h2hMode ? formatOrdinal(rank1) : formatRank(rank1)}
          </span>
        )}
      </td>
      <td className="py-1.5 px-2 text-right tabular-nums">
        <span
          className={`text-sm ${t1Better ? 'font-semibold' : 'text-[var(--text-muted)]'}`}
          style={t1Better ? { color: team1Color } : undefined}
        >
          {formatStat(val1, statKey)}
        </span>
      </td>
      <td className="py-1.5 px-2 text-right tabular-nums">
        <span
          className={`text-sm ${t2Better ? 'font-semibold' : 'text-[var(--text-muted)]'}`}
          style={t2Better ? { color: team2Color } : undefined}
        >
          {formatStat(val2, statKey)}
        </span>
      </td>
      <td className="py-1.5 pl-2 text-left tabular-nums w-12">
        {rank2 != null && (
          <span className="text-[10px] text-[var(--text-muted)]">
            {h2hMode ? formatOrdinal(rank2) : formatRank(rank2)}
          </span>
        )}
      </td>
    </tr>
  );
}

export default function StatComparison({ matchup, h2hStats, mode = 'season', team1Color: t1c, team2Color: t2c }) {
  const isH2H = mode === 'h2h';
  const data = isH2H ? h2hStats : matchup;
  const sections = isH2H ? H2H_STAT_SECTIONS : STAT_SECTIONS;
  const [sectionIndex, setSectionIndex] = useState(0);

  if (!data) return null;

  const team1Abbr = data.team1.abbreviation;
  const team2Abbr = data.team2.abbreviation;

  const team1Color = t1c || getTeamColor(isH2H ? team1Abbr : data.team1.id);
  const team2Color = t2c || getTeamColor(isH2H ? team2Abbr : data.team2.id);
  const team1Stats = data.team1.stats;
  const team2Stats = data.team2.stats;
  const team1Ranks = isH2H ? data.team1.ranks : data.team1.stats_ranks;
  const team2Ranks = isH2H ? data.team2.ranks : data.team2.stats_ranks;

  const currentSection = sections[sectionIndex];
  const canPrev = sectionIndex > 0;
  const canNext = sectionIndex < sections.length - 1;

  return (
    <div className="py-4">
      {/* Section nav */}
      <div className="flex items-center gap-3 mb-3">
        <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">
          {currentSection.title}
        </h4>
        <div className="flex items-center gap-1 ml-auto">
          {sections.map((_, i) => (
            <button
              key={i}
              onClick={() => setSectionIndex(i)}
              className={`w-1 h-1 rounded-full transition-colors cursor-pointer ${
                i === sectionIndex ? 'bg-[var(--text-secondary)]' : 'bg-[var(--border-color)] hover:bg-[var(--text-muted)]'
              }`}
            />
          ))}
          <button
            onClick={() => canPrev && setSectionIndex(sectionIndex - 1)}
            disabled={!canPrev}
            className={`ml-1 text-xs cursor-pointer ${canPrev ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]' : 'text-[var(--border-color)]'}`}
          >
            &larr;
          </button>
          <button
            onClick={() => canNext && setSectionIndex(sectionIndex + 1)}
            disabled={!canNext}
            className={`text-xs cursor-pointer ${canNext ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]' : 'text-[var(--border-color)]'}`}
          >
            &rarr;
          </button>
        </div>
      </div>

      {isH2H && (
        <p className="text-[10px] text-[var(--text-muted)] mb-2">
          {data.team1.gamesPlayed} game{data.team1.gamesPlayed !== 1 ? 's' : ''} played
        </p>
      )}

      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-color)]">
            <th className="text-left text-[10px] font-medium text-[var(--text-muted)] uppercase pb-1.5 pr-4">Stat</th>
            <th className="w-12"></th>
            <th className="text-right text-[10px] font-medium pb-1.5 px-2" style={{ color: team1Color }}>
              {team1Abbr}
            </th>
            <th className="text-right text-[10px] font-medium pb-1.5 px-2" style={{ color: team2Color }}>
              {team2Abbr}
            </th>
            <th className="w-12"></th>
          </tr>
        </thead>
        <tbody>
          {currentSection.stats.map((statKey) => (
            <StatRow
              key={statKey}
              statKey={statKey}
              team1Stats={team1Stats}
              team2Stats={team2Stats}
              team1Ranks={team1Ranks}
              team2Ranks={team2Ranks}
              team1Color={team1Color}
              team2Color={team2Color}
              h2hMode={isH2H}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
