import "../styles/PopupModal.css";

export default function PopupModal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-window" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3>{title}</h3>
          <button className="popup-close" onClick={onClose}>✖</button>
        </div>

        <div className="popup-content">
          {children}
        </div>
      </div>
    </div>
  );
}
