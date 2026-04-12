import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";

export function DocxInlinePreview({ fileUrl }) {
  const hostRef = useRef(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fileUrl) return undefined;
    let cancelled = false;
    const el = hostRef.current;
    if (!el) return undefined;

    setErr("");
    setLoading(true);
    el.innerHTML = "";

    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.blob();
      })
      .then(async (blob) => {
        if (cancelled) return;
        try {
          await renderAsync(blob, el, undefined, {
            className: "docx",
          });
          if (!cancelled) setLoading(false);
        } catch {
          if (!cancelled) {
            setErr(
              "Không hiển thị được file Word này trong trình duyệt. Vui lòng dùng Download.",
            );
            setLoading(false);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErr(
            "Không tải được file Word để xem trước. Vui lòng dùng nút Download.",
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      el.innerHTML = "";
    };
  }, [fileUrl]);

  if (err) {
    return <div className="review-status">{err}</div>;
  }

  return (
    <div className="review-docx-inner">
      {loading ? (
        <div className="review-docx-loading">Đang tải bản xem trước...</div>
      ) : null}
      <div
        ref={hostRef}
        className={
          loading ? "review-docx-host review-docx-host--loading" : "review-docx-host"
        }
      />
    </div>
  );
}
