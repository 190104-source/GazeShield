// src/context/TeamContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { getMyTeams } from "../services/teamService";

const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(null);

  const fetchTeams = async () => {
    const res = await getMyTeams();
    setTeams(res.data);
  };

  const getRole = (teamId) => {
    return teams.find(t => t.team_id === teamId)?.role;
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <TeamContext.Provider value={{
      teams,
      activeTeamId,
      setActiveTeamId,
      getRole,
      refreshTeams: fetchTeams
    }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeams = () => useContext(TeamContext);