// src/services/teamService.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const getMyTeams = () =>
  API.get("/teams/teams/my-teams");

export const createTeam = (ownerId, name) =>
  API.post(`/teams/teams/create/${ownerId}`, { name });

export const inviteMember = (teamId, userId) =>
  API.post(`/teams/teams/${teamId}/invite`, { user_id: userId });

export const removeMember = (teamId, userId) =>
  API.delete(`/teams/teams/${teamId}/remove/${userId}`);

export const leaveTeam = (teamId) =>
  API.delete(`/teams/teams/${teamId}/leave`);

export const deleteTeam = (teamId) =>
  API.delete(`/teams/teams/${teamId}`);