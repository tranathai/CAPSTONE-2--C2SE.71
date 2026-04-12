import { useEffect, useState } from "react";
import { getSubmission } from "../../../lib/api";
import "../../../styles/content.css";

function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return String(value);
  }
}

function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const submission = await getSubmission(1);
        if (active) setFeedbacks(submission.feedbacks || []);
      } catch (e) {
        if (active) setError(e.message || "Khong tai duoc feedback");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="submissions-page">
      <div className="page-header-row">
        <h1 className="page-title">Feedback</h1>
        <p className="page-lead">Nhan xet tu mentor cho bai nop cua ban.</p>
      </div>

      {loading ? (
        <div className="page-status">Dang tai...</div>
      ) : error ? (
        <div className="form-error">{error}</div>
      ) : feedbacks.length === 0 ? (
        <div className="page-muted">Chua co feedback.</div>
      ) : (
        <ul className="feedback-list">
          {feedbacks.map((item) => (
            <li key={item.id} className="feedback-item">
              <div className="feedback-head">
                <strong>{item.supervisor_name || "Mentor"}</strong>
                <span className="feedback-date">{formatDateTime(item.created_at)}</span>
              </div>
              <p className="feedback-body">{item.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FeedbackPage;
