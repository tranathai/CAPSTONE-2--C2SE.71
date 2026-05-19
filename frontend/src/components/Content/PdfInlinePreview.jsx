import { useEffect, useState } from "react";

/**
 * Loads the PDF via fetch and shows it in an iframe using a blob URL so the
 * viewer works when the API is on a different origin than the SPA (e.g. Vite
 * :5173 + Express :3000), where a direct iframe src often fails to render.
 */
export function PdfInlinePreview({ fileUrl, title = "PDF Viewer" }) {
  const [src, setSrc] = useState(null);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    if (!fileUrl) return undefined;
    let cancelled = false;
    let objectUrl = null;

    setPreviewError("");
    setSrc(null);

    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewError(
            "Không tải được file để xem trước. Vui lòng dùng nút Download.",
          );
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl]);

  if (previewError) {
    return <div className="review-status">{previewError}</div>;
  }
  if (!src) {
    return <div className="review-status">Đang tải bản xem trước...</div>;
  }
  const viewerSrc = `${src}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width`;

  return <iframe className="review-pdf-frame" src={viewerSrc} title={title} />;
}
