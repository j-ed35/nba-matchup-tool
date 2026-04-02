import { useState } from 'react';
import teams from '../data/nba_teams.json';

export default function TeamSelector({ selectedTeam, otherTeam, onSelect, label }) {
  const [conference, setConference] = useState('All');

  const filteredTeams = teams
    .filter((t) => conference === 'All' || t.conference === conference)
    .filter((t) => !otherTeam || t.id !== otherTeam)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </label>

      <div className="flex gap-1 bg-[var(--bg-primary)] rounded-lg p-1">
        {['All', 'East', 'West'].map((conf) => (
          <button
            key={conf}
            onClick={() => setConference(conf)}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              conference === conf
                ? 'bg-[var(--bg-card)] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {conf}
          </button>
        ))}
      </div>

      <select
        value={selectedTeam || ''}
        onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-white text-base appearance-none cursor-pointer hover:border-gray-500 transition-colors focus:outline-none focus:border-blue-500"
      >
        <option value="">Select a team...</option>
        {filteredTeams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.full_name} ({team.abbreviation})
          </option>
        ))}
      </select>
    </div>
  );
}
