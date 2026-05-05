// src/pages/Teams.jsx
import { useTeams } from "../context/TeamContext";

const Teams = () => {
  const { teams } = useTeams();

  return (
    <div>
      <h2>Your Teams</h2>

      {teams.map(team => (
        <div key={team.team_id}>
          <h3>{team.team_name}</h3>
          <p>Role: {team.role}</p>

          <button>View</button>

          {team.role === "owner" && (
            <button>Manage</button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Teams;