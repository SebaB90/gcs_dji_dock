import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";

// Import di tutti gli stili globali (reset, font, variabili)
import "./styles/App.css";

// Componente interno per gestire il routing condizionale
// Deve essere separato per poter usare l'hook useAuth() che sta dentro il Provider
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  // 1. Schermata di caricamento iniziale (mentre verifichiamo il token), viene visualizzata una rotella di caricamento
  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Initializing System...</p>
      </div>
    );
  }

  // 2. Routing: Se loggato -> Dashboard, Altrimenti -> Login
  return isAuthenticated ? <MainPage /> : <LoginPage />;
}

export default function App() {
  return (
    // Avvolgiamo tutta l'app con il contesto di Autenticazione
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}