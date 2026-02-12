import api from "./api";

// ======================
// MISSION SERVICE
// ======================

// ============
// CRUD MISSIONI
// ============

/**
 * Create a new mission
 * @param {Object} missionData - Mission data (name, waypoints, etc.)
 * @returns {Promise} - Created mission
 */
const createMission = async (missionData) => {
  const response = await api.post("/missions/create_mission", missionData);
  return response.data;
};

/**
 * Get all missions
 * @returns {Promise} - Array of all missions
 */
const getMissions = async () => {
  const response = await api.get("/missions/list_missions");
  return response.data;
};

/**
 * Get mission details by ID
 * @param {number} missionId - The mission ID
 * @returns {Promise} - Mission details
 */
const getMission = async (missionId) => {
  const response = await api.get(`/missions/list/${missionId}`);
  return response.data;
};

/**
 * Delete a mission
 * @param {number} missionId - The mission ID to delete
 * @returns {Promise} - Success message
 */
const deleteMission = async (missionId) => {
  const response = await api.delete(`/missions/delete/${missionId}`);
  return response.data;
};

// ============
// SCHEDULING
// ============

/**
 * Schedule a mission (once or recurring)
 * @param {number} missionId - The mission ID
 * @param {Object} scheduleData - Schedule data (type, dock_name, start_time, recurrence_pattern)
 * @returns {Promise} - Created schedule
 */
const scheduleMission = async (missionId, scheduleData) => {
  const response = await api.post(
    `/missions/schedules/schedule_mission/${missionId}`,
    scheduleData
  );
  return response.data;
};

/**
 * Get all active schedules (ordered by next execution)
 * @returns {Promise} - Array of scheduled missions
 */
const getSchedules = async () => {
  const response = await api.get("/missions/schedules/list_schedules");
  return response.data;
};

/**
 * Delete a schedule
 * @param {number} scheduleId - The schedule ID to delete
 * @returns {Promise} - Success message
 */
const deleteSchedule = async (scheduleId) => {
  const response = await api.delete(`/missions/schedules/delete/${scheduleId}`);
  return response.data;
};

// ============
// ESECUZIONI
// ============

/**
 * Execute a mission immediately
 * @param {number} missionId - The mission ID to execute
 * @param {string} dockName - The dock name (dock1, dock2, etc.)
 * @returns {Promise} - Execution result
 */
const executeMission = async (missionId, dockName = "dock1") => {
  const response = await api.post(
    `/missions/execute/execute_mission/${missionId}?dock_name=${dockName}`
  );
  return response.data;
};

/**
 * Get active mission executions
 * @returns {Promise} - Array of active executions
 */
const getActiveExecutions = async () => {
  const response = await api.get("/missions/execute/active_executions");
  return response.data;
};

/**
 * Get execution history
 * @param {Object} options - Options (limit, dock_name)
 * @returns {Promise} - Array of execution history
 */
const getExecutionHistory = async (options = {}) => {
  const { limit = 50, dock_name = null } = options;
  let url = `/missions/execute/history?limit=${limit}`;
  if (dock_name) {
    url += `&dock_name=${dock_name}`;
  }
  const response = await api.get(url);
  return response.data;
};

// Export all mission functions
const missionService = {
  // CRUD
  createMission,
  getMissions,
  getMission,
  deleteMission,
  // Scheduling
  scheduleMission,
  getSchedules,
  deleteSchedule,
  // Executions
  executeMission,
  getActiveExecutions,
  getExecutionHistory,
};

export default missionService;
