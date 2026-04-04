import { useState, useEffect } from 'react';
import { getPlayoffBracket } from '../utils/api';
import { transformBracketData } from '../utils/bracketTransform';

function TeamRow({ team, onSelect }) {
  const handleClick = () => {
    if (!team.isPlaceholder && onSelect) {
      onSelect(team.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-2.5 px-3 py-2 ${
        team.isPlaceholder ? 'opacity-50' : 'cursor-pointer hover:bg-[var(--bg-surface)]'
      }`}
    >
      {team.logo_url ? (
        <img src={team.logo_url} alt="" className="w-5 h-5 object-contain" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-[var(--border-color)]" />
      )}
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-[10px] text-[var(--text-muted)]">#{team.seed}</span>
        <span className="text-xs font-medium text-[var(--text-primary)] uppercase tracking-wide">
          {team.isPlaceholder ? team.name : team.tricode}
        </span>
      </div>
    </div>
  );
}

function MatchupCard({ matchup, onSelectTeam }) {
  return (
    <div className="border border-[var(--border-color)] rounded bg-[var(--bg-primary)]">
      <TeamRow team={matchup.highSeed} onSelect={onSelectTeam} />
      <div className="border-t border-[var(--border-color)]" />
      <TeamRow team={matchup.lowSeed} onSelect={onSelectTeam} />
    </div>
  );
}

function ConferenceBracket({ label, data, onSelectTeam }) {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest text-center">
        {label}
      </h3>

      {/* First Round */}
      <div className="flex flex-col gap-3">
        <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider text-center">
          First Round
        </p>
        <div className="grid grid-cols-2 gap-3">
          {data.firstRound.map((matchup, i) => (
            <MatchupCard key={i} matchup={matchup} onSelectTeam={onSelectTeam} />
          ))}
        </div>
      </div>

      {/* Play-In */}
      {data.playInMatchups.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider text-center">
            Play-In
          </p>
          <div className="grid grid-cols-2 gap-3">
            {data.playInMatchups.map((matchup, i) => (
              <MatchupCard key={i} matchup={matchup} onSelectTeam={onSelectTeam} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayoffBracket({ onSelectTeam }) {
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getPlayoffBracket()
      .then((data) => {
        if (cancelled) return;
        const transformed = transformBracketData(data);
        if (!transformed) {
          setError('No playoff bracket data available');
        } else {
          setBracket(transformed);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError('Failed to load playoff bracket');
        console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-[var(--text-muted)] border-t-[var(--accent)] rounded-full animate-spin" />
          <span className="text-xs text-[var(--text-muted)]">Loading bracket...</span>
        </div>
      </div>
    );
  }

  if (error || !bracket) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[var(--text-muted)]">
          {error || 'Select two teams above to compare'}
        </p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <p className="text-xs text-[var(--text-muted)] text-center mb-8">
        Select two teams above or select a 2026 playoff matchup
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-[900px] mx-auto">
        <ConferenceBracket label="Western Conference" data={bracket.west} onSelectTeam={onSelectTeam} />
        <ConferenceBracket label="Eastern Conference" data={bracket.east} onSelectTeam={onSelectTeam} />
      </div>
    </div>
  );
}
