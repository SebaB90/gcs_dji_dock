import api from "./api";

// ======================
// VIDEO SERVICE
// ======================

/**
 * Get current video source
 * @returns {Promise} - Current video source info
 */
const getVideoSource = async () => {
  const response = await api.get("/api/video/source");
  return response.data;
};

/**
 * Set video source
 * @param {string} sourceName - Source name (wide, zoom, thermal)
 * @returns {Promise} - Success message
 */
const setVideoSource = async (sourceName) => {
  const response = await api.post(`/api/video/source/${sourceName}`);
  return response.data;
};

// Export all video functions
const videoService = {
  getVideoSource,
  setVideoSource,
};

export default videoService;
