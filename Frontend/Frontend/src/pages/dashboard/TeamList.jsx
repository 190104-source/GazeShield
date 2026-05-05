export default function TeamList({ teams, selectedTeam, onSelect }) {
  return (
    <div>
      <h3 className="font-semibold mb-4">Your Teams</h3>

      <div className="space-y-2">
        {teams.map((team) => (
          <div
            key={team.team_id}
            onClick={() => onSelect(team)}
            className={`p-3 rounded cursor-pointer transition ${
              selectedTeam?.team_id === team.team_id
                ? "bg-blue-600 text-white"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            <p className="font-medium">{team.team_name}</p>
            <p className="text-xs opacity-80">{team.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}