import { useEffect, useState } from "react";
import { createFeedback, getFeedbacks } from "../../../lib/api";
import { DEMO_SUPERVISOR_ID } from "../../../config/demoUser";

function formatWhen(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return String(iso);
  }
}

export function MentorFeedbackSection({
  submissionVersionId,
  variant = "page",
  onFeedbacksChange,
}) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [content, setContent] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isPanel = variant === "panel";

  useEffect(() => {
    if (!submissionVersionId) {
      setFeedbacks([]);
      onFeedbacksChange?.([]);
      return undefined;
    }
    let cancelled = false;
    setLoadingList(true);
    setError("");
    getFeedbacks(submissionVersionId)
      .then((rows) => {
        if (!cancelled) {
          const list = rows || [];
          setFeedbacks(list);
          onFeedbacksChange?.(list);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Không tải được danh sách feedback");
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });
    return () => {
      cancelled = true;
    };
  }, [submissionVersionId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!submissionVersionId) {
      setError("Không xác định được phiên bản nộp");
      return;
    }
    if (!content.trim()) {
      setError("Vui lòng nhập nội dung feedback");
      return;
    }

    try {
      setPosting(true);
      await createFeedback({
        submission_version_id: submissionVersionId,
        supervisor_id: DEMO_SUPERVISOR_ID,
        content: content.trim(),
      });
      const next = await getFeedbacks(submissionVersionId);
      const list = next || [];
      setFeedbacks(list);
      onFeedbacksChange?.(list);
      setContent("");
      setSuccess("Đã gửi feedback thành công");
    } catch (e) {
      setError(e.message || "Không thể gửi feedback");
    } finally {
      setPosting(false);
    }
  }

  const sectionClass = isPanel
    ? "mentor-feedback-panel"
    : "review-feedback-section";

  if (!submissionVersionId) {
    return (
      <section className={sectionClass}>
        <h3 className={isPanel ? "rp-kicker" : "section-title"}>Gửi feedback</h3>
        <p className="page-muted">Chưa có phiên bản nộp để gắn feedback.</p>
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      <h3 className={isPanel ? "rp-kicker" : "section-title"}>
        Gửi feedback cho sinh viên
      </h3>
      {!isPanel ? (
        <p className="page-muted" style={{ marginTop: 0, marginBottom: 16 }}>
          Sinh viên sẽ xem được feedback trên trang xem bài nộp của họ.
        </p>
      ) : (
        <p className="rp-text rp-text-sm" style={{ marginTop: 6, marginBottom: 12 }}>
          Hiển thị trên trang bài nộp của sinh viên.
        </p>
      )}

      <form
        className={isPanel ? "mentor-feedback-form-panel" : "feedback-form"}
        onSubmit={handleSubmit}
      >
        <textarea
          className={`feedback-textarea mentor-feedback-textarea ${isPanel ? "mentor-feedback-textarea--panel" : ""}`}
          placeholder="Nhập nhận xét, hướng dẫn chỉnh sửa…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={posting || loadingList}
          rows={isPanel ? 5 : 6}
        />
        {error ? (
          <div className={isPanel ? "rp-message error" : "form-error"}>{error}</div>
        ) : null}
        {success ? (
          <div className={isPanel ? "rp-message success" : "form-success"}>
            {success}
          </div>
        ) : null}
        <div className={isPanel ? "mentor-feedback-actions" : ""}>
          <button
            className={isPanel ? "rp-btn primary" : "btn-primary"}
            type="submit"
            disabled={posting || loadingList}
          >
            {posting ? "Đang gửi…" : "Gửi feedback"}
          </button>
        </div>
      </form>

      <h4
        className={isPanel ? "rp-kicker" : "section-title"}
        style={{ marginTop: isPanel ? 20 : 28 }}
      >
        Đã gửi
      </h4>
      {loadingList ? (
        <p className="page-muted">Đang tải…</p>
      ) : feedbacks.length === 0 ? (
        <p className="page-muted">Chưa có feedback nào.</p>
      ) : (
        <ul className={isPanel ? "mentor-feedback-list-panel" : "feedback-list"}>
          {feedbacks.map((f) => (
            <li
              key={f.id}
              className={isPanel ? "rp-feedback-item" : "feedback-item"}
            >
              <div className={isPanel ? "rp-feedback-head" : "feedback-head"}>
                <strong>{f.supervisor_name || "Mentor"}</strong>
                <span className={isPanel ? "" : "feedback-date"}>
                  {formatWhen(f.created_at)}
                </span>
              </div>
              <p className={isPanel ? "rp-feedback-content" : "feedback-body"}>
                {f.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
