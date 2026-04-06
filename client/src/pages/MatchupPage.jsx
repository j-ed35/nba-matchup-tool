import { useState } from 'react';
import TeamSelector from '../components/TeamSelector';
import StatComparison from '../components/StatComparison';
import HeadToHead from '../components/HeadToHead';
import PlayerStats from '../components/PlayerStats';
import RadarChart from '../components/RadarChart';
import PlayoffBracket from '../components/PlayoffBracket';
import { useMatchupData } from '../hooks/useMatchupData';
import { getTeamColor } from '../utils/teamColors';

function MatchupHeader({ matchup, mode, onModeChange }) {
  const team1Color = getTeamColor(matchup.team1.id);
  const team2Color = getTeamColor(matchup.team2.id);

  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--border-color)]">
      <div className="flex items-baseline gap-3">
        <div className="flex items-baseline gap-1.5">
          {matchup.team1.conf_rank != null && (
            <span className="text-xs text-[var(--text-muted)]">#{matchup.team1.conf_rank}</span>
          )}
          <span className="text-lg font-semibold" style={{ color: team1Color }}>
            {matchup.team1.abbreviation}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {matchup.team1.record}
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)] uppercase">vs</span>
        <div className="flex items-baseline gap-1.5">
          {matchup.team2.conf_rank != null && (
            <span className="text-xs text-[var(--text-muted)]">#{matchup.team2.conf_rank}</span>
          )}
          <span className="text-lg font-semibold" style={{ color: team2Color }}>
            {matchup.team2.abbreviation}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {matchup.team2.record}
          </span>
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
          <div className="flex items-center gap-3 shrink-0">
            {hasTeams && (
              <button
                onClick={() => { setTeam1Id(null); setTeam2Id(null); setMode('season'); }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Back to bracket"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 6.5L8 2L14 6.5V13.5C14 14.0523 13.5523 14.5 13 14.5H3C2.44772 14.5 2 14.0523 2 13.5V6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M6 14.5V9.5H10V14.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight whitespace-nowrap">
                Matchup Tool
              </h1>
              <p className="text-[11px] text-[var(--text-muted)]">2025-26</p>
            </div>
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
        {hasTeams && matchup && !loading && (
          <MatchupHeader
            matchup={matchup}
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

        {!hasTeams && !loading && (
          <PlayoffBracket onSelectTeam={(teamId) => {
            if (!team1Id) setTeam1Id(teamId);
            else if (!team2Id && teamId !== team1Id) setTeam2Id(teamId);
          }} />
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
              {matchup && (
                <RadarChart matchup={matchup} h2hStats={h2hStats} mode={mode} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
