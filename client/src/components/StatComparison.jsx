import { useState } from 'react';
import { formatStat, formatRank, formatOrdinal, statDisplayName, LOWER_IS_BETTER } from '../utils/formatting';
import teams from '../data/nba_teams.json';

const STAT_SECTIONS = [
  {
    title: 'Record',
    stats: ['W', 'L', 'W_PCT'],
  },
  {
    title: 'Scoring & Playmaking',
    stats: ['PTS', 'REB', 'AST', 'STL', 'BLK', 'TOV'],
  },
  {
    title: 'Shooting',
    stats: ['FG_PCT', 'FG3_PCT', 'FT_PCT'],
  },
  {
    title: 'Rebounding & Fouls',
    stats: ['OREB', 'DREB', 'PF'],
  },
  {
    title: 'Advanced',
    stats: ['OFF_RATING', 'DEF_RATING', 'NET_RATING', 'PACE'],
  },
  {
    title: 'Misc',
    stats: ['PTS_OFF_TOV', 'PTS2ND_CHANCE', 'PTS_FB', 'PTS_PAINT'],
  },
  {
    title: 'Opponent',
    stats: ['OPP_PTS_OFF_TOV', 'OPP_PTS2ND_CHANCE', 'OPP_PTS_FB', 'OPP_PTS_PAINT'],
  },
];

const H2H_STAT_SECTIONS = [
  {
    title: 'Scoring & Playmaking',
    stats: ['PTS', 'REB', 'AST', 'STL', 'BLK', 'TOV'],
  },
  {
    title: 'Shooting',
    stats: ['FG_PCT', 'FG3_PCT', 'FT_PCT'],
  },
  {
    title: 'Rebounding & Fouls',
    stats: ['OREB', 'DREB', 'PF'],
  },
  {
    title: 'Advanced',
    stats: ['OFF_RATING', 'DEF_RATING', 'NET_RATING', 'PACE', 'TS_PCT', 'EFG_PCT'],
  },
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

  if (h2hMode) {
    const rank1 = team1Ranks?.[statKey];
    const rank2 = team2Ranks?.[statKey];

    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
        <div className="text-right flex items-center justify-end gap-2">
          <span
            className={`text-base tabular-nums ${t1Better ? 'font-bold' : 'text-gray-400'}`}
            style={t1Better ? { color: team1Color } : undefined}
          >
            {formatStat(val1, statKey)}
          </span>
          {rank1 != null && (
            <span className="text-[11px] text-gray-500">({formatOrdinal(rank1)})</span>
          )}
        </div>

        <div className="px-4 text-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
            {statDisplayName(statKey)}
          </span>
        </div>

        <div className="text-left flex items-center gap-2">
          {rank2 != null && (
            <span className="text-[11px] text-gray-500">({formatOrdinal(rank2)})</span>
          )}
          <span
            className={`text-base tabular-nums ${t2Better ? 'font-bold' : 'text-gray-400'}`}
            style={t2Better ? { color: team2Color } : undefined}
          >
            {formatStat(val2, statKey)}
          </span>
        </div>
      </div>
    );
  }

  // Season mode
  const rank1 = team1Ranks?.[`${statKey}_RANK`];
  const rank2 = team2Ranks?.[`${statKey}_RANK`];

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
      <div className="text-right flex items-center justify-end gap-2">
        {rank1 != null && (
          <span className="text-xs text-gray-500">{formatRank(rank1)}</span>
        )}
        <span
          className={`text-base tabular-nums ${t1Better ? 'font-bold' : 'text-gray-400'}`}
          style={t1Better ? { color: team1Color } : undefined}
        >
          {formatStat(val1, statKey)}
        </span>
      </div>

      <div className="px-4 text-center">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
          {statDisplayName(statKey)}
        </span>
      </div>

      <div className="text-left flex items-center gap-2">
        <span
          className={`text-base tabular-nums ${t2Better ? 'font-bold' : 'text-gray-400'}`}
          style={t2Better ? { color: team2Color } : undefined}
        >
          {formatStat(val2, statKey)}
        </span>
        {rank2 != null && (
          <span className="text-xs text-gray-500">{formatRank(rank2)}</span>
        )}
      </div>
    </div>
  );
}

export default function StatComparison({ matchup, h2hStats, mode = 'season' }) {
  const isH2H = mode === 'h2h';
  const data = isH2H ? h2hStats : matchup;
  const sections = isH2H ? H2H_STAT_SECTIONS : STAT_SECTIONS;
  const [sectionIndex, setSectionIndex] = useState(0);

  if (!data) return null;

  const team1Id = isH2H ? null : data.team1.id;
  const team2Id = isH2H ? null : data.team2.id;
  const team1Abbr = data.team1.abbreviation;
  const team2Abbr = data.team2.abbreviation;

  const team1Info = isH2H
    ? teams.find((t) => t.abbreviation === team1Abbr)
    : teams.find((t) => t.id === team1Id);
  const team2Info = isH2H
    ? teams.find((t) => t.abbreviation === team2Abbr)
    : teams.find((t) => t.id === team2Id);

  const team1Color = team1Info?.color || '#3b82f6';
  const team2Color = team2Info?.color || '#ef4444';

  const team1Stats = data.team1.stats;
  const team2Stats = data.team2.stats;
  const team1Ranks = isH2H ? data.team1.ranks : data.team1.stats_ranks;
  const team2Ranks = isH2H ? data.team2.ranks : data.team2.stats_ranks;

  const currentSection = sections[sectionIndex];
  const canPrev = sectionIndex > 0;
  const canNext = sectionIndex < sections.length - 1;

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl p-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-6 pb-4 border-b border-[var(--border-color)]">
        <div className="text-right">
          <span className="text-lg font-bold" style={{ color: team1Color }}>
            {team1Abbr}
          </span>
        </div>
        <div className="px-4">
          <span className="text-sm font-medium text-gray-500">VS</span>
        </div>
        <div className="text-left">
          <span className="text-lg font-bold" style={{ color: team2Color }}>
            {team2Abbr}
          </span>
        </div>
      </div>

      {isH2H && (
        <div className="text-center mb-4">
          <span className="text-xs text-gray-500">
            Based on {data.team1.gamesPlayed} game{data.team1.gamesPlayed !== 1 ? 's' : ''} played
          </span>
          <span className="text-xs text-gray-600 ml-2">
            &middot; Rankings among all 30 teams vs opponent
          </span>
        </div>
      )}

      {/* Section header with navigation arrows */}
      <div className="flex items-center justify-between mb-2 px-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          {currentSection.title}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={() => canPrev && setSectionIndex(sectionIndex - 1)}
            disabled={!canPrev}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
              canPrev ? 'text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer' : 'text-gray-700 cursor-default'
            }`}
          >
            ←
          </button>
          <button
            onClick={() => canNext && setSectionIndex(sectionIndex + 1)}
            disabled={!canNext}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
              canNext ? 'text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer' : 'text-gray-700 cursor-default'
            }`}
          >
            →
          </button>
        </div>
      </div>

      {/* Section dots indicator */}
      <div className="flex justify-center gap-1.5 mb-3">
        {sections.map((_, i) => (
          <button
            key={i}
            onClick={() => setSectionIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === sectionIndex ? 'bg-gray-300' : 'bg-gray-700 hover:bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Current section stats */}
      <div className="divide-y divide-[var(--border-color)]/30">
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
      </div>
    </div>
  );
}
