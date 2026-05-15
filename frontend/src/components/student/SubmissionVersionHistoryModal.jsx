import { useEffect, useState } from "react";
import Icon from "../UI/Icon.jsx";
import { submissions } from "../../lib/api.js";
import { getUploadUrl } from "../../lib/uploadUrl.js";

function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function VersionPreview({ version }) {
  if (!version) {
    return (
      <div className="submission-history-preview submission-history-preview--empty">
        <Icon name="FileText" size={40} sx={{ opacity: 0.25, marginBottom: 12 }} />
        <p>Chọn một phiên bản bên trái và bấm &quot;Xem&quot; để xem tài liệu</p>
      </div>
    );
  }

  const fileUrl = getUploadUrl(version.file_path);
  const name = version.original_filename || `Phiên bản v${version.version_number}`;
  const isPdf = version.file_path?.toLowerCase().endsWith(".pdf");

  return (
    <div className="submission-history-preview">
      <div className="submission-history-preview__meta">
        <strong>{name}</strong>
        <span className="submission-history-preview__ver">v{version.version_number}</span>
        {version.is_late ? (
          <span className="badge badge-danger">
            <Icon name="AlertTriangle" size={12} /> Trễ
          </span>
        ) : (
          <span className="badge badge-success">Đúng hạn</span>
        )}
      </div>
      {isPdf ? (
        <iframe src={fileUrl} title={name} className="submission-history-preview__iframe" />
      ) : (
        <div className="submission-history-preview__download">
          <Icon name="FileText" size={48} sx={{ opacity: 0.35, marginBottom: 12 }} />
          <p>{name}</p>
          <a href={fileUrl} className="btn btn-primary btn-sm" download target="_blank" rel="noreferrer">
            <Icon name="Download" size={14} /> Tải xuống
          </a>
        </div>
      )}
    </div>
  );
}

export default function SubmissionVersionHistoryModal({ open, submissionId, title, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const latestVersionNumber = versions.length
    ? Math.max(...versions.map((x) => Number(x.version_number)))
    : 0;

  useEffect(() => {
    if (!open || !submissionId) return;
    setSelectedVersion(null);
    setError("");
    setLoading(true);
    submissions
      .get(submissionId)
      .then((data) => {
        const list = Array.isArray(data?.versions) ? [...data.versions] : [];
        list.sort((a, b) => Number(b.version_number) - Number(a.version_number));
        setVersions(list);
      })
      .catch(() => {
        setVersions([]);
        setError("Không tải được lịch sử phiên bản");
      })
      .finally(() => setLoading(false));
  }, [open, submissionId]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal submission-history-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="submission-history-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="submission-history-modal__header">
          <div>
            <h3 id="submission-history-title">Lịch sử phiên bản</h3>
            {title && <p className="submission-history-modal__subtitle">{title}</p>}
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Đóng">
            <Icon name="Close" size={16} />
          </button>
        </header>

        {loading ? (
          <div className="submission-history-modal__loading">
            <div className="spinner" />
          </div>
        ) : error ? (
          <p className="submission-history-modal__error">{error}</p>
        ) : versions.length === 0 ? (
          <p className="submission-history-modal__empty">Chưa có phiên bản nào</p>
        ) : (
          <div className="submission-history-modal__body">
            <aside className="submission-history-sidebar">
              <p className="submission-history-sidebar__label">
                {versions.length} phiên bản
              </p>
              <ul className="submission-history-list">
                {versions.map((v) => {
                  const active = selectedVersion?.id === v.id;
                  const isLatest = Number(v.version_number) === latestVersionNumber;
                  return (
                    <li key={v.id}>
                      <div
                        className={`submission-history-item${active ? " submission-history-item--active" : ""}`}
                      >
                        <div className="submission-history-item__top">
                          <div className="submission-history-item__ver">
                            <strong>v{v.version_number}</strong>
                            {isLatest && (
                              <span className="badge badge-success submission-history-item__badge">
                                Mới nhất
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className={`btn btn-sm ${active ? "btn-primary" : "btn-secondary"}`}
                            onClick={() => setSelectedVersion(v)}
                          >
                            <Icon name="Eye" size={14} /> Xem
                          </button>
                        </div>
                        <div className="submission-history-item__date">
                          {v.submitted_at
                            ? new Date(v.submitted_at).toLocaleString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </div>
                        <div className="submission-history-item__file" title={v.original_filename || ""}>
                          {v.original_filename || "—"}
                          <span>{formatFileSize(v.file_size)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </aside>
            <main className="submission-history-main">
              <VersionPreview version={selectedVersion} />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
