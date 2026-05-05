import { useState } from "react";
import { api } from "../../api/api";

export default function CreateTeam({ refreshTeams }) {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);

  const createTeam = async () => {
    if (!teamName.trim()) {
      alert("Team name required");
      return;
    }

    try {
      setLoading(true);

      await api.post("/teams/teams/create", {
        name: teamName, // alias="name" → team_name
      });

      setTeamName("");
      refreshTeams();
    } catch (err) {
      console.error("Create team error:", err);

      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        alert(detail);
      } else {
        alert("Failed to create team");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <input
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        placeholder="New team name"
        className="w-full p-2 mb-2 rounded bg-gray-700 text-sm text-white"
      />

      <button
        onClick={createTeam}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 py-2 rounded text-sm"
      >
        {loading ? "Creating..." : "+ Create Team"}
      </button>
    </div>
  );
}