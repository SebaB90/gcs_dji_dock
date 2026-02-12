import { createContext, useState, useEffect, useContext } from "react";
import authService from "../services/auth.service";

const AuthContext = createContext(null);            // Creazione dello spazio di memoria per l'autenticazione

export const AuthProvider = ({ children }) => {     // Componente che avvolge l'app e fornisce il contesto di autenticazione, children sono i componenti figli
  // Stati per l'utente, autenticazione e caricamento iniziale
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Al caricamento, controlla se c'è un token salvato
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("gcs_token");
      if (token) {
        try {
          // Verifica se il token è valido chiamando il backend
          const res = await authService.getCurrentUser();
          setUser(res.data);
          setIsAuthenticated(true);
        } catch (e) {
          console.error("Sessione scaduta o invalida", e);
          await authService.logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    // 1. Chiama il service per il login
    const loginData = await authService.login(username, password);
    // 2. Recupera i dati utente aggiornati
    const res = await authService.getCurrentUser();
    // 3. Aggiorna lo stato
    setUser(res.data);
    setIsAuthenticated(true);
    return loginData;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook per usare il contesto facilmente negli altri file
export const useAuth = () => useContext(AuthContext);