import { useState } from "react";
import "./RequiredDocumentsPicker.css";

export const DOCUMENT_TEMPLATES = [
  "Proposal",
  "Project Plan",
  "SRS",
  "Design",
  "Báo cáo tuần",
  "Source Code",
  "Test Plan",
  "Handover Doc",
  "API Documentation",
  "Risk Register",
];

function uniqAppend(list, item) {
  const t = item.trim();
  if (!t) return list;
  const lower = t.toLowerCase();
  if (list.some((x) => x.toLowerCase() === lower)) return list;
  return [...list, t];
}

function removeAt(list, idx) {
  return list.filter((_, i) => i !== idx);
}

export default function RequiredDocumentsPicker({ value, onChange, disabled, ..._rest }) {
  const [customLine, setCustomLine] = useState("");

  const addOne = (label) => {
    onChange(uniqAppend(value, label));
  };

  const addCustom = () => {
    const t = customLine.trim();
    if (!t) return;
    onChange(uniqAppend(value, t));
    setCustomLine("");
  };

  return (
    <div className="rdp-wrap">
      <label className="form-group" style={{ marginBottom: 8, display: "block" }}>
        Tài liệu cần nộp
      </label>
      <div className="rdp-panel rdp-panel--single" role="region" aria-label="Chọn tài liệu từ mẫu">
        <p className="rdp-hint rdp-hint--tight">
          Dùng tag đã chọn hoặc bấm [+] để thêm nhanh từ mẫu; có thể gõ tùy chỉnh ở cuối.
        </p>
        <p className="rdp-section-label">CHỌN NHANH</p>
        <div className="rdp-quick">
          {DOCUMENT_TEMPLATES.map((t) => {
            const taken = value.some((x) => x.toLowerCase() === t.toLowerCase());
            return (
              <button key={t} type="button" disabled={disabled || taken} onClick={() => addOne(t)}>
                [+] {t}
              </button>
            );
          })}
        </div>
        <div className="rdp-chips rdp-chips--selected" aria-live="polite">
          {value.map((label, i) => (
            <span key={`${label}-${i}`} className="rdp-chip">
              {label}
              <button type="button" aria-label="Xóa" disabled={disabled} onClick={() => onChange(removeAt(value, i))}>
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="rdp-row rdp-row--tight">
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 120 }}
            placeholder="…hoặc gõ tài liệu tùy chỉnh"
            value={customLine}
            disabled={disabled}
            onChange={(e) => setCustomLine(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <button type="button" className="btn btn-primary btn-sm" disabled={disabled || !customLine.trim()} onClick={addCustom}>
            Thêm
          </button>
        </div>
      </div>

      <div className="rdp-summary">
        Đã chọn: {value.length ? value.join(", ") : "—"}
      </div>
    </div>
  );
}
