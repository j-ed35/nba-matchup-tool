import { getTeamColor } from '../utils/teamColors';

export default function HeadToHead({ matchup, team1Color: t1c, team2Color: t2c }) {
  if (!matchup?.h2h_games?.length) return null;

  const { team1, team2, h2h_games } = matchup;
  const team1Color = t1c || getTeamColor(team1.id);
  const team2Color = t2c || getTeamColor(team2.id);

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

  function buildBoxScoreUrl(game) {
    if (!game.game_id) return null;
    const t1Abbr = team1.abbreviation.toLowerCase();
    const t2Abbr = team2.abbreviation.toLowerCase();
    return `https://www.nba.com/game/${t2Abbr}-vs-${t1Abbr}-${game.game_id}/box-score`;
  }

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
            <th className="text-right pb-1.5"></th>
          </tr>
        </thead>
        <tbody>
          {h2h_games.map((game) => {
            const t1Won = game.team1_wl === 'W';
            const boxScoreUrl = buildBoxScoreUrl(game);
            return (
              <tr
                key={game.game_id}
                className="border-b border-[var(--border-color)]/20 hover:bg-white/[0.015] transition-colors"
              >
                <td className="py-1.5 text-[var(--text-muted)]">
                  {new Date(game.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className={`py-1.5 text-right tabular-nums ${t1Won ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                  {game.team1_pts}
                </td>
                <td className={`py-1.5 text-right tabular-nums ${!t1Won ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                  {game.team2_pts}
                </td>
                <td className="py-1.5 text-right">
                  {boxScoreUrl && (
                    <a
                      href={boxScoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      box
                    </a>
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
