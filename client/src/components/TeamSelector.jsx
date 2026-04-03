import teams from '../data/nba_teams.json';

const sorted = [...teams].sort((a, b) => a.full_name.localeCompare(b.full_name));

export default function TeamSelector({ selectedTeam, otherTeam, onSelect, label }) {
  const filteredTeams = sorted.filter((t) => !otherTeam || t.id !== otherTeam);

  return (
    <select
      value={selectedTeam || ''}
      onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
      className="bg-transparent border border-[var(--border-color)] rounded px-2 py-1 text-xs text-[var(--text-secondary)] appearance-none cursor-pointer hover:border-[var(--text-muted)] transition-colors focus:outline-none focus:border-[var(--accent)]"
    >
      <option value="">{label}</option>
      {filteredTeams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.abbreviation} — {team.full_name}
        </option>
      ))}
    </select>
  );
}
