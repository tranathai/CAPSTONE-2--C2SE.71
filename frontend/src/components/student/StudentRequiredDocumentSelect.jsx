import "../admin/RequiredDocumentsPicker.css";

export function parseMilestoneRequiredDocs(milestone) {
  if (!milestone) return [];
  const raw = milestone.required_documents;
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch {
      /* legacy plain text */
    }
    return raw.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** Chọn một tag tài liệu từ danh sách admin cấu hình cho mốc. */
export default function StudentRequiredDocumentSelect({ options, value, onChange, disabled }) {
  const docs = Array.isArray(options) ? options : [];

  if (docs.length === 0) {
    return (
      <p className="rdp-hint" style={{ margin: 0 }}>
        Admin chưa cấu hình tài liệu cần nộp cho mốc này. Vui lòng liên hệ quản trị viên.
      </p>
    );
  }

  return (
    <div className="student-doc-select" role="group" aria-label="Chọn tài liệu cần nộp">
      <p className="rdp-hint rdp-hint--tight" style={{ marginBottom: 6 }}>
        Chọn loại tài liệu bạn đang nộp *
      </p>
      <div className="rdp-quick">
        {docs.map((label) => {
          const active = value && String(value).trim().toLowerCase() === label.toLowerCase();
          return (
            <button
              key={label}
              type="button"
              className={`student-doc-btn${active ? " student-doc-btn--active" : ""}`}
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onChange(label)}
            >
              {label}
            </button>
          );
        })}
      </div>
      {value ? (
        <p className="rdp-summary" style={{ marginTop: 8, marginBottom: 0 }}>
          Đã chọn: <strong>{value}</strong>
        </p>
      ) : null}
    </div>
  );
}
