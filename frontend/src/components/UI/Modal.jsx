function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return (
    <div className="app-modal-overlay" role="dialog" aria-modal="true">
      <div className="app-modal">
        <div className="app-modal-header">
          <h3>{title}</h3>
          <button type="button" className="app-modal-close" onClick={onClose}>
            x
          </button>
        </div>
        <div className="app-modal-body">{children}</div>
        {footer ? <div className="app-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export default Modal;
