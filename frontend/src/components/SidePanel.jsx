import "../styles/SidePanel.css";   // ⬅️ cambiato percorso

export default function SidePanel({ open, title, onClose, children }) {
  return (
    <div className={`sidepanel ${open ? "open" : ""}`}>
      <div className="sidepanel-header">
        <h3>{title}</h3>
        <button className="close-btn" onClick={onClose}>✖</button>
      </div>

      <div className="sidepanel-content">
        {children}
      </div>
    </div>
  );
}
