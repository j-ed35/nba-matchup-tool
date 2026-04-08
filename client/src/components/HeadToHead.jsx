import { useState, useCallback } from 'react';
import { getTeamColor } from '../utils/teamColors';
import { getBoxscore } from '../utils/api';

function formatPlayerLine(p) {
  const parts = [`${p.pts} PTS (${p.fgm}-${p.fga} FG)`];
  if (p.fg3m && p.fg3m > 0) parts.push(`${p.fg3m} 3PM`);
  if (p.reb >= 4) parts.push(`${p.reb} REB`);
  if (p.ast >= 4) parts.push(`${p.ast} AST`);
  if (p.stl >= 3) parts.push(`${p.stl} STL`);
  if (p.blk >= 3) parts.push(`${p.blk} BLK`);
  return `${p.name} — ${parts.join(' | ')}`;
}

function GameExpanded({ data, team1Id, team2Id, team1Color, team2Color }) {
  if (!data) return null;

  const t1 = data.teams[String(team1Id)] || data.teams[String(team2Id)];
  const t2 = data.teams[String(team2Id)] || data.teams[String(team1Id)];

  // Ensure correct mapping
  const team1Data = data.teams[String(team1Id)];
  const team2Data = data.teams[String(team2Id)];

  // Fallback if team IDs don't match (away/home mismatch) — use tricode order
  const teams = Object.values(data.teams);
  const d1 = team1Data || teams[0];
  const d2 = team2Data || teams[1];
  const c1 = team1Data ? team1Color : team2Color;
  const c2 = team2Data ? team2Color : team1Color;

  const renderTeamBlock = (team, color) => {
    const s = team.team_stats;
    return (
      <div className="mb-2">
        <div className="font-medium text-[10px] mb-0.5" style={{ color }}>{team.tricode}</div>
        {team.top_players.map((p, i) => (
          <div key={i} className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
            {formatPlayerLine(p)}
          </div>
        ))}
        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
          FG: {s.fgm}-{s.fga} ({s.fg_pct}%) | 3P: {s.fg3m}-{s.fg3a} ({s.fg3_pct}%)
        </div>
        <div className="text-[10px] text-[var(--text-muted)]">
          REB: {s.reb} | AST: {s.ast} | STL: {s.stl} | BLK: {s.blk}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/[0.02] rounded px-3 py-2.5 mt-1 mb-1">
      <div className="text-[10px] text-[var(--text-muted)] mb-2">
        {data.lead_changes} Lead Changes | Tied {data.times_tied}x
      </div>

      {renderTeamBlock(d1, c1)}
      {renderTeamBlock(d2, c2)}

      <div className="border-t border-[var(--border-color)]/30 pt-1.5 mt-1.5 space-y-0.5">
        {[d1, d2].map((t, i) => (
          <div key={i} className="text-[10px] text-[var(--text-muted)]">
            <span style={{ color: i === 0 ? c1 : c2 }}>{t.tricode}</span>
            {' — '}Bench: {t.team_stats.bench_pts} | Paint: {t.team_stats.paint_pts} | 2nd Chance: {t.team_stats.pts_2nd_chance} | Pts Off TO: {t.team_stats.pts_off_tov}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeadToHead({ matchup, team1Color: t1c, team2Color: t2c }) {
  const [expanded, setExpanded] = useState({});
  const [boxscores, setBoxscores] = useState({});
  const [loadingIds, setLoadingIds] = useState({});

  if (!matchup?.h2h_games?.length) return null;

  const { team1, team2, h2h_games } = matchup;
  const team1Color = t1c || getTeamColor(team1.id);
  const team2Color = t2c || getTeamColor(team2.id);

  // Sort most recent first
  const sortedGames = [...h2h_games].sort((a, b) => new Date(b.date) - new Date(a.date));

  const team1Wins = h2h_games.filter((g) => g.team1_wl === 'W').length;
  const team2Wins = h2h_games.filter((g) => g.team2_wl === 'W').length;

  let seriesLabel;
  if (team1Wins > team2Wins) {
    seriesLabel = `${team1.abbreviation} leads ${team1Wins}-${team2Wins}`;
  } else if (team2Wins > team1Wins) {
    seriesLabel = `${team2.abbreviation} leads ${team2Wins}-${team1Wins}`;
  } else {
    seriesLabel = `Tied ${team1Wins}-${team2Wins}`;
  }

  const toggleGame = useCallback(async (gameId) => {
    setExpanded((prev) => {
      const isOpen = prev[gameId];
      if (isOpen) return { ...prev, [gameId]: false };

      // Fetch boxscore if not cached
      if (!boxscores[gameId]) {
        setLoadingIds((l) => ({ ...l, [gameId]: true }));
        getBoxscore(gameId)
          .then((data) => {
            setBoxscores((b) => ({ ...b, [gameId]: data }));
          })
          .catch((err) => {
            console.error('Failed to fetch boxscore:', err);
          })
          .finally(() => {
            setLoadingIds((l) => ({ ...l, [gameId]: false }));
          });
      }

      return { ...prev, [gameId]: true };
    });
  }, [boxscores]);

  return (
    <div className="py-4 xl:sticky xl:top-4 xl:self-start">
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">
          Head-to-Head
        </h4>
        <span
          className="text-xs font-medium"
          style={{
            color:
              team1Wins > team2Wins
                ? team1Color
                : team2Wins > team1Wins
                  ? team2Color
                  : 'var(--text-secondary)',
          }}
        >
          {seriesLabel}
        </span>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--border-color)]">
            <th className="text-left pb-1.5 font-medium text-[var(--text-muted)]">Date</th>
            <th className="text-right pb-1.5 font-medium" style={{ color: team1Color }}>
              {team1.abbreviation}
            </th>
            <th className="text-right pb-1.5 font-medium" style={{ color: team2Color }}>
              {team2.abbreviation}
            </th>
            <th className="text-right pb-1.5 w-5"></th>
          </tr>
        </thead>
        <tbody>
          {sortedGames.map((game) => {
            const t1Won = game.team1_wl === 'W';
            const isExpanded = expanded[game.game_id];
            const isLoading = loadingIds[game.game_id];
            const boxscore = boxscores[game.game_id];
            return (
              <tr
                key={game.game_id}
                className="border-b border-[var(--border-color)]/20 align-top"
              >
                <td colSpan={4} className="p-0">
                  <div
                    className="flex items-center py-1.5 cursor-pointer hover:bg-white/[0.015] transition-colors px-0"
                    onClick={() => toggleGame(game.game_id)}
                  >
                    <span className="flex-1 text-[var(--text-muted)]">
                      {new Date(game.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className={`w-12 text-right tabular-nums ${t1Won ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                      {game.team1_pts}
                    </span>
                    <span className={`w-12 text-right tabular-nums ${!t1Won ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                      {game.team2_pts}
                    </span>
                    <span className="w-5 text-right text-[10px] text-[var(--text-muted)]">
                      {isExpanded ? '\u25BE' : '\u25B8'}
                    </span>
                  </div>
                  {isExpanded && (
                    isLoading ? (
                      <div className="flex items-center gap-1.5 px-2 py-3">
                        <div className="w-3 h-3 border border-[var(--text-muted)] border-t-[var(--accent)] rounded-full animate-spin" />
                        <span className="text-[10px] text-[var(--text-muted)]">Loading...</span>
                      </div>
                    ) : boxscore ? (
                      <GameExpanded
                        data={boxscore}
                        team1Id={team1.id}
                        team2Id={team2.id}
                        team1Color={team1Color}
                        team2Color={team2Color}
                      />
                    ) : null
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
