import { useEffect, useState } from "react";
import { api } from "../../api/api";
import TeamList from "./TeamList";
import TeamDetails from "./TeamDetails";
import CreateTeam from "./CreateTeam";

export default function TeamsSection({ selectedTeam, setSelectedTeam }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await api.get("/teams/teams/my-teams");
      setTeams(res.data);

      // Auto-select first team ONLY if none selected yet
      if (!selectedTeam && res.data.length > 0) {
        setSelectedTeam(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch teams", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-gray-400">Loading teams...</p>;
  }

  return (
    <div className="flex gap-6 h-[70vh]">
      {/* LEFT PANEL */}
      <div className="w-80 bg-gray-800 rounded-lg p-4 flex flex-col gap-4">
        <CreateTeam refreshTeams={fetchTeams} />

        <TeamList
          teams={teams}
          selectedTeam={selectedTeam}
          onSelect={setSelectedTeam}
        />
      </div>

      {/* RIGHT PANEL */}
      {selectedTeam ? (
        <TeamDetails team={selectedTeam} refreshTeams={fetchTeams} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          No team selected
        </div>
      )}
    </div>
  );
}
