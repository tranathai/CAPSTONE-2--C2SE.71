import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Expand } from "lucide-react";
import { API_ORIGIN, getSubmission } from "../../../lib/api";
import { submissionFileKind } from "../../../lib/submissionPreview";
import { SubmissionDocumentPreview } from "../SubmissionDocumentPreview";
import "../../../styles/content.css";

function ReviewPage() {
  const { submissionId } = useParams();
  const id = Number(submissionId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!Number.isInteger(id) || id <= 0) {
        setError("Submission không hợp lệ");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const data = await getSubmission(id);
        if (mounted) {
          setSubmission(data);
        }
      } catch (apiError) {
        if (mounted) {
          setError(apiError.message || "Không tải được submission");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
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

  const teamName = submission?.team_name || "—";
  const studentName = submission?.student_name || "—";
  const milestoneName = submission?.milestone_name || null;
  const displayTitle = submission?.submission_title || "";
  const versionNumber = submission?.version_number ?? "—";
  const fileName = filePath
    ? filePath.split("/").pop()
    : displayTitle || "Tài liệu";

  return (
    <div className="review-page">
      <div className="review-breadcrumb">
        <span className="review-breadcrumb-muted">Projects</span>
        <span className="review-breadcrumb-sep">›</span>
        <span className="review-breadcrumb-muted">{teamName}</span>
        <span className="review-breadcrumb-sep">›</span>
        <span className="review-breadcrumb-strong">
          Review: {studentName}
        </span>
      </div>

      <div className="review-main">
        <div className="review-meta-bar">
          {milestoneName ? (
            <span className="review-pill">Milestone: {milestoneName}</span>
          ) : null}
        </div>

        <div className="review-title-row">
          <div>
            <h2 className="review-title">{fileName}</h2>
            <p className="review-subtitle">
              {displayTitle && displayTitle !== fileName ? (
                <>
                  {displayTitle}
                  <br />
                </>
              ) : null}
              {`Version ${versionNumber}`}
            </p>
          </div>

          <div className="review-actions">
            <a
              className="review-btn secondary"
              href={fileUrl || "#"}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={16} />
              Download
            </a>
            {kind === "pdf" || kind === "docx" ? (
              <a
                className="review-btn primary"
                href={fileUrl || "#"}
                target="_blank"
                rel="noreferrer"
              >
                <Expand size={16} />
                Fullscreen
              </a>
            ) : null}
          </div>
        </div>

        <div className="review-pdf-shell">
          {loading ? (
            <div className="review-pdf-page">
              <div className="review-skeleton line w-sm" />
              <div className="review-skeleton block h-md" />
              <div className="review-skeleton line w-lg" />
              <div className="review-skeleton line w-lg" />
              <div className="review-skeleton line w-md" />
            </div>
          ) : error ? (
            <div className="review-status">{error}</div>
          ) : (
            <SubmissionDocumentPreview
              filePath={filePath}
              fileUrl={fileUrl}
              pdfTitle="Submission PDF Viewer"
            />
          )}

          <div className="review-pdf-toolbar" aria-hidden="true">
            <span className="review-toolbar-pill">
              <span className="review-toolbar-dot" />
              <span className="review-toolbar-text">Preview</span>
              <span className="review-toolbar-dot" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewPage;
