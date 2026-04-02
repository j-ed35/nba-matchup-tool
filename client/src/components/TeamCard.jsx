import teams from '../data/nba_teams.json';

export default function TeamCard({ teamId, standings }) {
  const team = teams.find((t) => t.id === teamId);
  if (!team) return null;

  const teamStanding = standings?.find(
    (s) => String(s.team_id) === String(teamId)
  );

  return (
    <div
      className="bg-[var(--bg-card)] rounded-xl p-5 border-l-4 flex items-center gap-4"
      style={{ borderLeftColor: team.color }}
    >
      <img
        src={team.logo_url}
        alt={team.full_name}
        className="w-16 h-16 object-contain"
        loading="lazy"
      />
      <div className="flex flex-col">
        <h3 className="text-xl font-bold text-white">{team.full_name}</h3>
        <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
          {teamStanding && (
            <>
              <span className="font-semibold text-gray-200">
                {teamStanding.wins}-{teamStanding.losses}
              </span>
              <span className="text-gray-600">|</span>
              <span>
                {team.conference} #{teamStanding.conf_rank}
              </span>
            </>
          )}
          {!teamStanding && (
            <span>{team.conference}ern Conference</span>
          )}
        </div>
      </div>
    </div>
  );
}
