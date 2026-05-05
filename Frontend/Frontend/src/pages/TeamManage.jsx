import { inviteMember, removeMember, deleteTeam } from "../services/teamService";
import { useTeams } from "../context/TeamContext";

const TeamManage = ({ teamId }) => {
  const { refreshTeams } = useTeams();

  const handleInvite = async (userId) => {
    await inviteMember(teamId, userId);
    refreshTeams();
  };

  const handleRemove = async (userId) => {
    await removeMember(teamId, userId);
    refreshTeams();
  };

  const handleDelete = async () => {
    await deleteTeam(teamId);
    refreshTeams();
  };

  return (
    <div>
      <h2>Manage Team</h2>
      <button onClick={handleDelete}>Delete Team</button>
    </div>
  );
};

export default TeamManage;