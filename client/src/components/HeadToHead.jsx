import teams from '../data/nba_teams.json';

export default function HeadToHead({ matchup }) {
  if (!matchup?.h2h_games?.length) return null;

  const { team1, team2, h2h_games } = matchup;
  const team1Info = teams.find((t) => t.id === team1.id);
  const team2Info = teams.find((t) => t.id === team2.id);

  const team1Wins = h2h_games.filter((g) => g.team1_wl === 'W').length;
  const team2Wins = h2h_games.filter((g) => g.team2_wl === 'W').length;

  let seriesLabel;
  if (team1Wins > team2Wins) {
    seriesLabel = `${team1.abbreviation} leads ${team1Wins}-${team2Wins}`;
  } else if (team2Wins > team1Wins) {
    seriesLabel = `${team2.abbreviation} leads ${team2Wins}-${team1Wins}`;
  } else {
    seriesLabel = `Series tied ${team1Wins}-${team2Wins}`;
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 xl:sticky xl:top-6 xl:self-start">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Head-to-Head</h3>
        <span
          className="text-sm font-semibold px-3 py-1 rounded-full bg-white/5"
          style={{
            color:
              team1Wins > team2Wins
                ? team1Info?.color
                : team2Wins > team1Wins
                  ? team2Info?.color
                  : 'var(--text-primary)',
          }}
        >
          {seriesLabel}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-[var(--border-color)]">
              <th className="text-left py-2 px-3 font-medium">Date</th>
              <th className="text-center py-2 px-3 font-medium" style={{ color: team1Info?.color }}>
                {team1.abbreviation}
              </th>
              <th className="text-center py-2 px-3 font-medium" style={{ color: team2Info?.color }}>
                {team2.abbreviation}
              </th>
              <th className="text-center py-2 px-3 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {h2h_games.map((game) => {
              const t1Won = game.team1_wl === 'W';
              return (
                <tr
                  key={game.game_id}
                  className="border-b border-[var(--border-color)]/30 hover:bg-white/[0.02]"
                >
                  <td className="py-2.5 px-3 text-gray-400">
                    {new Date(game.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-center tabular-nums ${t1Won ? 'font-bold text-white' : 'text-gray-500'}`}
                  >
                    {game.team1_pts}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-center tabular-nums ${!t1Won ? 'font-bold text-white' : 'text-gray-500'}`}
                  >
                    {game.team2_pts}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{
                        color: t1Won ? team1Info?.color : team2Info?.color,
                        backgroundColor: t1Won
                          ? `${team1Info?.color}20`
                          : `${team2Info?.color}20`,
                      }}
                    >
                      {t1Won ? team1.abbreviation : team2.abbreviation} W
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
