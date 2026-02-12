import api from "./api";

// ======================
// DOCK SERVICE
// ======================

/**
 * Get telemetry data for a specific dock
 * @param {string} dockName - The name of the dock (e.g., "dock1")
 * @returns {Promise} - Telemetry data from the dock
 */
const getDockTelemetry = async (dockName) => {
  const response = await api.get(`/docks/${dockName}/telemetry`);
  return response.data;
};

/**
 * Get list of all available docks
 * @returns {Promise} - Array of dock names
 */
const getAvailableDocks = async () => {
  const response = await api.get("/docks/list");
  return response.data;
};

// Export all dock functions
const dockService = {
  getDockTelemetry,
  getAvailableDocks,
  // Alias for backward compatibility
  getTelemetry: getDockTelemetry,
};

export default dockService;
