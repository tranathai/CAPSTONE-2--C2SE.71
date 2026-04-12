import { submissionFileKind } from "../../lib/submissionPreview";
import { DocxInlinePreview } from "./DocxInlinePreview";
import { PdfInlinePreview } from "./PdfInlinePreview";

export function SubmissionDocumentPreview({ filePath, fileUrl, pdfTitle }) {
  const kind = submissionFileKind(filePath);

  if (!fileUrl) {
    return (
      <div className="review-status">Chưa có file cho phiên bản này.</div>
    );
  }
  if (kind === "pdf") {
    return <PdfInlinePreview fileUrl={fileUrl} title={pdfTitle} />;
  }
  if (kind === "docx") {
    return <DocxInlinePreview fileUrl={fileUrl} />;
  }
  if (kind === "doc") {
    return (
      <div className="review-status">
        Định dạng .doc (Word cũ) không xem trước được trong trình duyệt. Vui lòng
        tải xuống để mở bằng Word.
      </div>
    );
  }
  return (
    <div className="review-status">
      Không hỗ trợ xem trước định dạng này. Vui lòng tải file để xem.
    </div>
  );
}
