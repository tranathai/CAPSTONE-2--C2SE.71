import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getSubmission } from "../../lib/api";
import { MentorFeedbackSection } from "../Content/Mentor/MentorFeedbackSection";
import "../../styles/rightpanel.css";

function RightPanel() {
  const { submissionId } = useParams();
  const currentSubmissionId = Number(submissionId);
  const [submission, setSubmission] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const studentName = submission?.student_name || "Alex Smith";

  const aiSummary = useMemo(() => {
    if (!feedbacks.length) {
      return "Chưa có feedback. Hãy gửi feedback đầu tiên cho version này.";
    }
    return feedbacks[0].content;
  }, [feedbacks]);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!Number.isInteger(currentSubmissionId) || currentSubmissionId <= 0) {
        setError("Submission không hợp lệ");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const submissionResponse = await getSubmission(currentSubmissionId);
        if (!isMounted) return;
        setSubmission(submissionResponse);
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.message || "Không tải được dữ liệu right panel");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [currentSubmissionId]);

  return (
    <div className="right">
      <div className="rp-section rp-section--tight">
        <div className="rp-row">
          <div className="rp-kicker">Sinh viên</div>
          <button className="rp-link" type="button">
            Lịch sử
          </button>
        </div>
        <div className="rp-profile rp-profile--compact">
          <div className="rp-avatar" aria-hidden="true" />
          <div className="rp-profile-text">
            <div className="rp-name">{studentName}</div>
            <div className="rp-meta">
              {loading
                ? "…"
                : `Phiên bản ${submission?.version_number ?? "—"}`}
            </div>
          </div>
        </div>
      </div>

      <div className="rp-feedback-workspace">
        {loading ? (
          <p className="rp-text" style={{ padding: "16px 24px" }}>
            Đang tải…
          </p>
        ) : error ? (
          <p className="rp-text" style={{ padding: "16px 24px", color: "#b91c1c" }}>
            {error}
          </p>
        ) : (
          <MentorFeedbackSection
            submissionVersionId={submission?.submission_version_id}
            variant="panel"
            onFeedbacksChange={setFeedbacks}
          />
        )}
      </div>

      <div className="rp-ai rp-ai--compact">
        <div className="rp-ai-head">
          <div className="rp-ai-title">
            <span className="rp-ai-spark">✦</span>
            Tóm tắt / gợi ý
          </div>
        </div>
        <div className="rp-ai-card">
          {loading ? (
            <p className="rp-text">Đang tải…</p>
          ) : (
            <>
              <p className="rp-text rp-ai-snippet">{aiSummary}</p>
              <div className="rp-text rp-text-sm rp-list">
                <div>{`Số feedback: ${feedbacks.length}`}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RightPanel;
