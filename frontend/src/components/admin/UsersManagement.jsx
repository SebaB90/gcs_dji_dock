import { useState, useEffect } from "react";
import authService from "../../services/auth.service"; // Assicurati che il percorso sia giusto
import { Trash2, UserPlus, Shield, User, ShieldAlert } from "lucide-react";
import "./UsersManagement.css";

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Stato per il form di creazione
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "viewer" // Default role
  });

  // Carica utenti all'avvio
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await authService.getAllUsers();
      setUsers(res.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Errore caricamento. Sei Admin?");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo utente?")) return;
    try {
      await authService.deleteUser(id);
      // Rimuovi dalla lista locale senza ricaricare tutto
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert("Impossibile eliminare l'utente.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
        alert("Username e Password obbligatori");
        return;
    }

    try {
      await authService.createUser(newUser);
      // Reset form e ricarica lista
      setNewUser({ username: "", password: "", full_name: "", role: "viewer" });
      fetchUsers(); 
      alert("Utente creato con successo!");
    } catch (err) {
      alert(err.response?.data?.detail || "Errore creazione utente");
    }
  };

  // Helper per icone ruolo
  const getRoleIcon = (role) => {
    if (role === 'admin') return <ShieldAlert size={16} color="#ef4444" />; // Rosso
    if (role === 'operator') return <Shield size={16} color="#f59e0b" />;   // Arancio
    return <User size={16} color="#3b82f6" />;                              // Blu
  };

  return (
    <div className="users-management-panel">
      <h2>Gestione Team</h2>

      {/* --- FORM CREAZIONE --- */}
      <div className="add-user-form">
        <h3><UserPlus size={18}/> Nuovo Utente</h3>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <input 
                type="text" placeholder="Username" required 
                value={newUser.username}
                onChange={e => setNewUser({...newUser, username: e.target.value})}
            />
            <select 
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value})}
            >
                <option value="viewer">Viewer</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
            </select>
          </div>
          
          <input 
            type="text" placeholder="Nome Completo (Opzionale)" 
            value={newUser.full_name}
            onChange={e => setNewUser({...newUser, full_name: e.target.value})}
          />
          
          <input 
            type="password" placeholder="Password" required 
            value={newUser.password}
            onChange={e => setNewUser({...newUser, password: e.target.value})}
          />
          
          <button type="submit" className="btn-create">Crea Utente</button>
        </form>
      </div>

      {/* --- LISTA UTENTI --- */}
      <div className="user-list">
        <h3>Utenti Attivi ({users.length})</h3>
        
        {loading && <div className="loading-users">Caricamento...</div>}
        {error && <div className="error-msg">{error}</div>}
        
        <div className="list-container">
          {users.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <div className="user-role-icon">{getRoleIcon(user.role)}</div>
                <div>
                  <div className="username">{user.username}</div>
                  <div className="fullname">{user.full_name || "Nessun nome"}</div>
                  <div className="role-badge">{user.role}</div>
                </div>
              </div>
              <button 
                className="btn-delete" 
                onClick={() => handleDelete(user.id)}
                title="Elimina Utente"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}