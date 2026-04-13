import { useEffect, useState } from "react";
import { Download, Expand } from "lucide-react";
import { getSubmission } from "../../lib/api";
import "../../styles/content.css";

const SUBMISSION_ID = 1;

function ReviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSubmission() {
      try {
        setLoading(true);
        setError("");
        const response = await getSubmission(SUBMISSION_ID);
        if (isMounted) {
          setSubmission(response.data);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.message || "Không tải được submission");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSubmission();

    return () => {
      isMounted = false;
    };
  }, []);

  const teamName = submission?.team_name || "CS-401 Senior Capstone";
  const studentName = submission?.student_name || "Alex Smith";
  const filePath = submission?.file_path || "";
  const versionNumber = submission?.version_number ?? 2;
  const fileName = filePath ? filePath.split("/").pop() : "Final Technical Report.pdf";

  return (
    <div className="review-page">
      <div className="review-breadcrumb">
        <span className="review-breadcrumb-muted">Projects</span>
        <span className="review-breadcrumb-sep">›</span>
        <span className="review-breadcrumb-muted">{teamName}</span>
        <span className="review-breadcrumb-sep">›</span>
        <span className="review-breadcrumb-strong">{`Review: ${studentName}`}</span>
      </div>

      <div className="review-main">
        <div className="review-title-row">
          <div>
            <h2 className="review-title">{fileName}</h2>
            <p className="review-subtitle">
              {`Version ${versionNumber}`}
            </p>
          </div>

          <div className="review-actions">
            <a
              className="review-btn secondary"
              href={filePath || "#"}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={16} />
              Download
            </a>
            <a
              className="review-btn primary"
              href={filePath || "#"}
              target="_blank"
              rel="noreferrer"
            >
              <Expand size={16} />
              Fullscreen
            </a>
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
              <div className="review-skeleton line w-lg" />
              <div className="review-skeleton line w-lg" />
              <div className="review-skeleton diagram">
                System Architectural Diagram Placeholder
              </div>
              <div className="review-skeleton line w-lg" />
              <div className="review-skeleton line w-lg" />
              <div className="review-skeleton line w-lg" />
            </div>
          ) : error ? (
            <div className="review-status">{error}</div>
          ) : filePath ? (
            <iframe
              className="review-pdf-frame"
              src={filePath}
              title="Submission PDF Viewer"
            />
          ) : (
            <div className="review-status">Chưa có file PDF cho version này</div>
          )}

          <div className="review-pdf-toolbar" aria-hidden="true">
            <span className="review-toolbar-pill">
              <span className="review-toolbar-dot" />
              <span className="review-toolbar-text">Page 1 of 24</span>
              <span className="review-toolbar-dot" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewPage;
