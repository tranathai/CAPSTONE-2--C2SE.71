import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "../../components/UI/Icon.jsx";
import { submissions, feedbacks } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";
import { getUploadUrl } from "../../lib/uploadUrl.js";

export default function MentorReview() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [submission, setSubmission] = useState(null);
  const [existingFeedbacks, setExistingFeedbacks] = useState([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    submissions.get(Number(submissionId)).then(async (s) => {
      setSubmission(s);
      const fbs = await feedbacks.byVersion(s.version_id).catch(() => []);
      setExistingFeedbacks(fbs);
    }).catch(() => showToast("Không tải được", "error"));
  }, [submissionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) { showToast("Nội dung feedback không được trống", "error"); return; }
    setSubmitting(true);
    try {
      await feedbacks.create({ submission_version_id: submission.version_id, content: feedbackText, is_final: isFinal });
      showToast("Gửi phản hồi thành công!", "success");
      setFeedbackText("");
      const fbs = await feedbacks.byVersion(submission.version_id);
      setExistingFeedbacks(fbs);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!submission) return <div className="loading-screen"><div className="spinner" /></div>;

  const fileUrl = getUploadUrl(submission.file_path);

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate("/supervisor/submissions")}>
          <Icon name="ArrowBack" size={14} /> Quay lại
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
        {/* Document */}
        <div className="card">
          <div className="card-title"><Icon name="Description" size={14} sx={{ marginRight: 6 }} />Tài liệu</div>
          <div style={{ marginBottom: 12, fontSize: "0.875rem", color: "#64748b" }}>
            {submission.team_name} • {submission.milestone_name || "—"} • v{submission.version_number}
          </div>
          {submission.file_path?.endsWith(".pdf") ? (
            <iframe src={fileUrl} style={{ width: "100%", height: "550px", border: "1px solid #e2e8f0", borderRadius: 8 }} title="Document" />
          ) : (
            <div style={{ padding: 40, textAlign: "center", background: "#f8fafc", borderRadius: 8 }}>
              <Icon name="Description" size={48} sx={{ opacity: 0.3, margin: "0 auto 12px" }} />
              <p>{submission.original_filename || submission.title}</p>
              <a href={fileUrl} className="btn btn-primary btn-sm" style={{ marginTop: 12 }} download>Tải xuống</a>
            </div>
          )}
        </div>

        {/* Feedback panel */}
        <div>
          <div className="card">
            <div className="card-title">Phản hồi đã gửi</div>
            {existingFeedbacks.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center", padding: "16px 0" }}>Chưa có phản hồi</p>
            ) : (
              existingFeedbacks.map((f) => (
                <div key={f.id} style={{ background: "#f8fafc", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 4 }}>
                    {f.supervisor_name} • {new Date(f.created_at).toLocaleString("vi-VN")}
                    {f.is_final && <span className="badge badge-success" style={{ marginLeft: 6 }}><Icon name="CheckCircle" size={10} /> Final</span>}
                  </div>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>{f.content}</p>
                </div>
              ))
            )}
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-title"><Icon name="Send" size={14} sx={{ marginRight: 6 }} />Gửi phản hồi mới</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <textarea className="form-input" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Nhập phản hồi cho sinh viên..." style={{ minHeight: 120 }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <input type="checkbox" id="isFinal" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} />
                <label htmlFor="isFinal" style={{ fontSize: "0.875rem", cursor: "pointer" }}>Đánh dấu là phản hồi cuối cùng</label>
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
                <Icon name="Send" size={16} /> {submitting ? "Đang gửi..." : "Gửi phản hồi"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
