import { useEffect, useMemo, useState } from "react";
import { createFeedback, getFeedbacks, getSubmission } from "../../lib/api";
import "../../styles/rightpanel.css";

const SUBMISSION_ID = 1;
const DEFAULT_SUPERVISOR_ID = 2;

function RightPanel() {
  const [submission, setSubmission] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const versionId = submission?.submission_version_id;
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
      try {
        setLoading(true);
        setError("");

        const submissionResponse = await getSubmission(SUBMISSION_ID);
        if (!isMounted) return;
        setSubmission(submissionResponse.data);

        if (submissionResponse.data?.submission_version_id) {
          const feedbackResponse = await getFeedbacks(
            submissionResponse.data.submission_version_id,
          );
          if (isMounted) {
            setFeedbacks(feedbackResponse.data || []);
          }
        }
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
  }, []);

  async function handlePublish() {
    try {
      setError("");
      setSuccess("");

      if (!versionId) {
        setError("Không xác định được submission version");
        return;
      }

      if (!content.trim()) {
        setError("Vui lòng nhập feedback trước khi Publish");
        return;
      }

      setPosting(true);
      await createFeedback({
        submission_version_id: versionId,
        supervisor_id: DEFAULT_SUPERVISOR_ID,
        content: content.trim(),
      });

      const feedbackResponse = await getFeedbacks(versionId);
      setFeedbacks(feedbackResponse.data || []);
      setContent("");
      setSuccess("Lưu feedback thành công");
    } catch (apiError) {
      setError(apiError.message || "Không thể lưu feedback");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="right">
      <div className="rp-ai">
        <div className="rp-ai-head">
          <div className="rp-ai-title">
            <span className="rp-ai-spark">✦</span>
            AI-Generated Summary
          </div>
          <button className="rp-icon-btn" type="button" aria-label="Collapse">
            ▴
          </button>
        </div>

        <div className="rp-ai-card">
          {loading ? (
            <p className="rp-text">Đang tải dữ liệu...</p>
          ) : (
            <>
              <p className="rp-text">{aiSummary}</p>
              <div className="rp-text rp-text-sm rp-list">
                <div>{`Total feedback: ${feedbacks.length}`}</div>
                <div>{`Current version: ${submission?.version_number ?? "-"}`}</div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rp-section">
        <div className="rp-row">
          <div className="rp-kicker">Student Profile</div>
          <button className="rp-link" type="button">
            View History
          </button>
        </div>

        <div className="rp-profile">
          <div className="rp-avatar" aria-hidden="true" />
          <div>
            <div className="rp-name">{studentName}</div>
            <div className="rp-meta">Computer Science Major • Senior</div>
          </div>
        </div>
      </div>

      <div className="rp-section">
        <div className="rp-kicker">Instructor Feedback</div>
        <textarea
          className="rp-textarea"
          placeholder="Write your detailed feedback here..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />

        {error ? <div className="rp-message error">{error}</div> : null}
        {success ? <div className="rp-message success">{success}</div> : null}

        <div className="rp-chips">
          <button className="rp-chip" type="button">
            Apply Template
          </button>
          <button className="rp-chip" type="button">
            Record Audio
          </button>
        </div>

        <div className="rp-actions">
          <button
            className="rp-btn primary"
            type="button"
            onClick={handlePublish}
            disabled={posting}
          >
            {posting ? "Publishing..." : "Publish"}
          </button>
          <button className="rp-btn" type="button">
            Save Draft
          </button>
        </div>

        <div className="rp-feedback-list">
          {(feedbacks || []).map((item) => (
            <div className="rp-feedback-item" key={item.id}>
              <div className="rp-feedback-head">
                <span>{item.supervisor_name || "Supervisor"}</span>
                <span>{new Date(item.created_at).toLocaleString()}</span>
              </div>
              <div className="rp-feedback-content">{item.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RightPanel;
