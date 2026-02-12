import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";
import { Lock, User, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  // Definizione degli stati locali per username, password, visibilità password, errori e loading
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Funzione per gestire il submit del form di login, scatta quando l'utente preme il pulsante di login
  const handleSubmit = async (e) => {
    e.preventDefault();   // Previene il comportamento di default del form (refresh della pagina)
    setError("");         // Resetta eventuali errori precedenti
    setIsLoading(true);   // Imposta lo stato di loading per disabilitare il form e mostrare un indicatore

    // Validate input, verifica che username e password non siano vuoti prima di procedere con la chiamata al backend
    if (!username || !password) {
      setError("Please enter both username and password");
      setIsLoading(false);
      return;
    }

    try {
      await login(username, password);  // Chiamata asincrona che scatta quando viene premuto il pulsante di login, se il login ha successo il codice salta al blocco finally altrimenti passa al catch
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
              type={showPassword ? "text" : "password"}  // Se showPassword è true, tipo text (testo visibile), altrimenti nascondi con i pallini (tipo password)
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
