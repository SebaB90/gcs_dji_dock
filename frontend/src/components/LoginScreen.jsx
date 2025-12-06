import { useState } from "react";
import axios from "axios";
import "../styles/LoginScreen.css";
import { Lock, User, Eye, EyeOff } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate input
    if (!username || !password) {
      setError("Please enter both username and password");
      setIsLoading(false);
      return;
    }

    try {
      // Call backend login endpoint
      const response = await axios.post(`${BACKEND_URL}/login`, {
        username,
        password,
      });

      // Store JWT token and expiration in localStorage
      const { access_token, expires_in } = response.data;
      localStorage.setItem("gcs_token", access_token);
      localStorage.setItem("gcs_token_expires", Date.now() + expires_in * 1000);
      localStorage.setItem("gcs_username", username);

      // Configure axios default headers for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      // Call success callback
      onLoginSuccess();
    } catch (err) {
      console.error("Login error:", err);
      
      if (err.response?.status === 401) {
        setError("Invalid username or password");
      } else if (err.code === "ERR_NETWORK") {
        setError("Cannot connect to server. Please check if the backend is running.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background overlay */}
      <div className="login-bg-overlay"></div>

      {/* Login Card */}
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <img src="/logo-fr-medium.png" alt="Company Logo" />
        </div>

        {/* Title */}
        <h1 className="login-title">DJI Dock Control System</h1>
        <p className="login-subtitle">Secure Ground Control Station</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Username Field */}
          <div className="input-group">
            <div className="input-icon">
              <User size={18} />
            </div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div className="input-group">
            <div className="input-icon">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Error Message */}
          {error && <div className="login-error">{error}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>Authorized personnel only</p>
        </div>
      </div>
    </div>
  );
}
