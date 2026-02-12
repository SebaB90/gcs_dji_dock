import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://192.168.1.61:8000";

// Create axios instance with default config
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  withCredentials: true, // Enable cookies for session management
});

// Request interceptor to add auth tokens if needed
api.interceptors.request.use(
  (config) => {
    // Add JWT token from localStorage to every request
    const token = localStorage.getItem('gcs_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could trigger logout
      console.error("Unauthorized access");
    }
    return Promise.reject(error);
  }
);

export default api;
export { BACKEND_URL };
