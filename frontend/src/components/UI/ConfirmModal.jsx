/**
 * Hộp thoại xác nhận thay cho window.confirm — dùng overlay/modal thống nhất với app.
 */
export default function ConfirmModal({
  open,
  title = "Xác nhận",
  message,
  confirmLabel = "Đồng ý",
  cancelLabel = "Hủy",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="presentation" onClick={busy ? undefined : onCancel}>
      <div
        className="modal"
        style={{ maxWidth: 420 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-modal-title" style={{ marginBottom: 10 }}>{title}</h3>
        {message && (
          <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: 20 }}>{message}</p>
        )}
        <div className="modal-actions" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Đang xử lý…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
