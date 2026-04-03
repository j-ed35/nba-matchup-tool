import { useState } from 'react';
import TeamSelector from '../components/TeamSelector';
import StatComparison from '../components/StatComparison';
import HeadToHead from '../components/HeadToHead';
import PlayerStats from '../components/PlayerStats';
import { useMatchupData } from '../hooks/useMatchupData';
import teams from '../data/nba_teams.json';

function MatchupHeader({ team1Id, team2Id, standings, mode, onModeChange }) {
  const team1 = teams.find((t) => t.id === team1Id);
  const team2 = teams.find((t) => t.id === team2Id);
  const standingsList = standings?.standings || [];
  const t1Standing = standingsList.find((s) => String(s.team_id) === String(team1Id));
  const t2Standing = standingsList.find((s) => String(s.team_id) === String(team2Id));

  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--border-color)]">
      <div className="flex items-baseline gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold" style={{ color: team1?.color }}>
            {team1?.abbreviation}
          </span>
          {t1Standing && (
            <span className="text-xs text-[var(--text-muted)]">
              {t1Standing.wins}-{t1Standing.losses}
            </span>
          )}
        </div>
        <span className="text-xs text-[var(--text-muted)] uppercase">vs</span>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold" style={{ color: team2?.color }}>
            {team2?.abbreviation}
          </span>
          {t2Standing && (
            <span className="text-xs text-[var(--text-muted)]">
              {t2Standing.wins}-{t2Standing.losses}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        {['season', 'h2h'].map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              mode === m
                ? 'bg-[var(--border-color)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {m === 'season' ? 'Season' : 'H2H'}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MatchupPage() {
  const [team1Id, setTeam1Id] = useState(null);
  const [team2Id, setTeam2Id] = useState(null);
  const [mode, setMode] = useState('season');
  const { matchup, players, h2hStats, h2hPlayers, standings, loading, error } = useMatchupData(team1Id, team2Id, mode);

  const hasTeams = team1Id && team2Id;
  const isH2H = mode === 'h2h';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="border-b border-[var(--border-color)]">
        <div className="max-w-[1400px] mx-auto px-5 py-3 flex items-center justify-between">
          <div className="shrink-0">
            <h1 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight whitespace-nowrap">
              NBA Matchup Tool
            </h1>
            <p className="text-[11px] text-[var(--text-muted)]">2025-26</p>
          </div>
          <div className="flex gap-4">
            <TeamSelector
              selectedTeam={team1Id}
              otherTeam={team2Id}
              onSelect={setTeam1Id}
              label="Team 1"
            />
            <TeamSelector
              selectedTeam={team2Id}
              otherTeam={team1Id}
              onSelect={setTeam2Id}
              label="Team 2"
            />
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-5">
        {hasTeams && (matchup || h2hStats) && !loading && (
          <MatchupHeader
            team1Id={team1Id}
            team2Id={team2Id}
            standings={standings}
            mode={mode}
            onModeChange={setMode}
          />
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-[var(--text-muted)] border-t-[var(--accent)] rounded-full animate-spin" />
              <span className="text-xs text-[var(--text-muted)]">Loading...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="border border-[var(--negative)]/30 rounded px-3 py-2 mt-4">
            <p className="text-xs text-[var(--negative)]">{error}</p>
          </div>
        )}

        {!team1Id && !team2Id && !loading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-[var(--text-muted)]">Select two teams to compare</p>
          </div>
        )}

        {!loading && (isH2H ? h2hStats : matchup) && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-0 mt-0">
            <div>
              <StatComparison matchup={matchup} h2hStats={h2hStats} mode={mode} />
              {isH2H ? (
                h2hPlayers && h2hStats && (
                  <PlayerStats players={h2hPlayers} matchup={h2hStats} mode="h2h" />
                )
              ) : (
                matchup && players && (
                  <PlayerStats players={players} matchup={matchup} mode="season" />
                )
              )}
            </div>
            <div className="xl:border-l border-[var(--border-color)] xl:pl-5">
              {matchup && <HeadToHead matchup={matchup} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
