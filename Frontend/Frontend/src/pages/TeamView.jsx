import { leaveTeam } from "../services/teamService";
import { useTeams } from "../context/TeamContext";

const TeamView = ({ teamId }) => {
  const { refreshTeams } = useTeams();

  const handleLeave = async () => {
    await leaveTeam(teamId);
    refreshTeams();
  };

  return (
    <div>
      <h2>Team Details</h2>
      <button onClick={handleLeave}>Leave Team</button>
    </div>
  );
};

export default TeamView;