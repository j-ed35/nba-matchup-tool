import { useState } from 'react';
import TeamSelector from '../components/TeamSelector';
import TeamCard from '../components/TeamCard';
import StatComparison from '../components/StatComparison';
import HeadToHead from '../components/HeadToHead';
import PlayerStats from '../components/PlayerStats';
import { useMatchupData } from '../hooks/useMatchupData';

export default function MatchupPage() {
  const [team1Id, setTeam1Id] = useState(null);
  const [team2Id, setTeam2Id] = useState(null);
  const { matchup, players, standings, loading, error } = useMatchupData(team1Id, team2Id);

  const standingsList = standings?.standings || [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            NBA Matchup Tool
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Compare teams side-by-side for the 2025-26 season
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Team Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <TeamSelector
              selectedTeam={team1Id}
              otherTeam={team2Id}
              onSelect={setTeam1Id}
              label="Team 1"
            />
            {team1Id && <TeamCard teamId={team1Id} standings={standingsList} />}
          </div>

          <div className="space-y-4">
            <TeamSelector
              selectedTeam={team2Id}
              otherTeam={team1Id}
              onSelect={setTeam2Id}
              label="Team 2"
            />
            {team2Id && <TeamCard teamId={team2Id} standings={standingsList} />}
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Loading matchup data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* No Selection Prompt */}
        {!team1Id && !team2Id && !loading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-600 text-lg">
              Select two teams above to compare
            </p>
          </div>
        )}

        {/* Matchup Content */}
        {matchup && !loading && (
          <div className="space-y-8">
            <StatComparison matchup={matchup} />
            <HeadToHead matchup={matchup} />
            <PlayerStats players={players} matchup={matchup} />
          </div>
        )}
      </main>
    </div>
  );
}
