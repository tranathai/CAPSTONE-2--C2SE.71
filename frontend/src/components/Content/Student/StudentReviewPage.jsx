import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Expand } from "lucide-react";
import { API_ORIGIN, getSubmission } from "../../../lib/api";
import { submissionFileKind } from "../../../lib/submissionPreview";
import { SubmissionDocumentPreview } from "../SubmissionDocumentPreview";
import "../../../styles/content.css";

function formatWhen(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return String(iso);
  }
}

function StudentReviewPage() {
  const { submissionId } = useParams();
  const id = Number(submissionId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!Number.isInteger(id) || id <= 0) {
        setError("Submission khong hop le");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const data = await getSubmission(id);
        if (mounted) setSubmission(data);
      } catch (apiError) {
        if (mounted) setError(apiError.message || "Khong tai duoc submission");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [id]);

  const filePath = submission?.file_path || "";
  const fileUrl = filePath ? `${API_ORIGIN}${filePath}` : "";
  const kind = submissionFileKind(filePath);
  const fileName = filePath ? filePath.split("/").pop() : submission?.submission_title || "Tai lieu";
  const feedbacks = submission?.feedbacks ?? [];

  return (
    <div className="review-page">
      <div className="review-main">
        <div className="review-title-row">
          <div>
            <h2 className="review-title">{fileName}</h2>
            <p className="review-subtitle">{`Version ${submission?.version_number ?? "-"}`}</p>
          </div>

          <div className="review-actions">
            <a className="review-btn secondary" href={fileUrl || "#"} target="_blank" rel="noreferrer">
              <Download size={16} />
              Download
            </a>
            {kind === "pdf" || kind === "docx" ? (
              <a className="review-btn primary" href={fileUrl || "#"} target="_blank" rel="noreferrer">
                <Expand size={16} />
                Fullscreen
              </a>
            ) : null}
          </div>
        </div>

        <div className="review-pdf-shell">
          {loading ? (
            <div className="review-status">Dang tai...</div>
          ) : error ? (
            <div className="review-status">{error}</div>
          ) : (
            <SubmissionDocumentPreview
              filePath={filePath}
              fileUrl={fileUrl}
              pdfTitle="Student Submission PDF Viewer"
            />
          )}
        </div>

        <section className="review-feedback-section">
          <h3 className="section-title">Feedback tu mentor</h3>
          {feedbacks.length === 0 ? (
            <p className="page-muted">Chua co feedback.</p>
          ) : (
            <ul className="feedback-list">
              {feedbacks.map((f) => (
                <li key={f.id} className="feedback-item">
                  <div className="feedback-head">
                    <strong>{f.supervisor_name || "Mentor"}</strong>
                    <span className="feedback-date">{formatWhen(f.created_at)}</span>
                  </div>
                  <p className="feedback-body">{f.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default StudentReviewPage;
