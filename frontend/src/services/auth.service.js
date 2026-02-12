import api from "./api";

// ======================
// LOGIN E LOGOUT
// ======================
const login = async (username, password) => {
  const res = await api.post("/users/login", { username, password });
  if (res.data.access_token) {
    localStorage.setItem("gcs_token", res.data.access_token);
    localStorage.setItem("gcs_username", username);
  }
  return res.data;
};

const logout = () => {
  localStorage.removeItem("gcs_token");
  localStorage.removeItem("gcs_username");
};

const getCurrentUser = () => api.get("/users/current_user");


// ======================
// GESTIONE UTENTI (Admin)
// ======================
const getAllUsers = () => {
  return api.get("/users/all_users");
};

const createUser = (userData) => {
  // userData deve essere { username, password, role, ... }
  return api.post("/users/create_user", userData);
};

const deleteUser = (userId) => {
  return api.delete(`/users/delete_user/${userId}`);
};

export default {
  login,
  logout,
  getCurrentUser,
  getAllUsers,  // <--- Export
  createUser,   // <--- Export
  deleteUser    // <--- Export
};