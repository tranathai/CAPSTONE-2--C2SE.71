import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "../../components/UI/Icon.jsx";
import { submissions, feedbacks, ai, getApiErrorMessage } from "../../lib/api.js";
import { summariesFromFeedbacks, displayAiSummary } from "../../lib/feedbackSummary.js";
import { useToast } from "../../hooks/useToast.js";
import { getUploadUrl } from "../../lib/uploadUrl.js";
import { resolveSubmissionVersionId } from "../../lib/submissionVersion.js";

export default function StudentReview() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [submission, setSubmission] = useState(null);
  const [feedbacksList, setFeedbacksList] = useState([]);
  const [summarizing, setSummarizing] = useState(null);
  const [summaryMap, setSummaryMap] = useState({});

  useEffect(() => {
    setSummaryMap({});
    submissions.get(Number(submissionId)).then(async (s) => {
      setSubmission(s);
      const versionId = resolveSubmissionVersionId(s);
      if (!versionId) {
        setFeedbacksList([]);
        return;
      }
      const fbs = await feedbacks.byVersion(versionId).catch(() => []);
      setFeedbacksList(fbs);
      setSummaryMap(summariesFromFeedbacks(fbs));
    }).catch(() => showToast("Không tải được submission", "error"));
  }, [submissionId]);

  const summarize = async (feedbackId, content) => {
    setSummarizing(feedbackId);
    try {
      const result = await ai.summarize({ content, feedback_id: feedbackId });
      setSummaryMap((p) => ({ ...p, [feedbackId]: displayAiSummary(result.summary) }));
    } catch (err) {
      showToast(getApiErrorMessage(err, "Tính năng AI tạm thời không khả dụng"), "error");
    } finally {
      setSummarizing(null);
    }
  };

  if (!submission) return <div className="loading-screen"><div className="spinner" /></div>;

  const fileUrl = getUploadUrl(submission.file_path);

  /** Tránh chuỗi dài / URL làm tràn cột; giới hạn chiều cao để cuộn trong khối thay vì kéo dài cả trang. */
  const feedbackTextStyle = {
    fontSize: "0.875rem",
    lineHeight: 1.6,
    color: "#334155",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    maxHeight: "min(50vh, 400px)",
    overflowY: "auto",
    margin: 0,
  };
  const aiSummaryScrollStyle = {
    marginTop: 4,
    maxHeight: "calc(8 * 1.5 * 0.82rem)",
    minHeight: 0,
    overflowY: "scroll",
    overflowX: "hidden",
    fontSize: "0.82rem",
    lineHeight: 1.5,
    color: "#1e3a8a",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    paddingRight: 4,
    WebkitOverflowScrolling: "touch",
  };

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <Icon name="ArrowLeft" size={14} /> Quay lại
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 380px)", gap: 20, alignItems: "start" }}>
        {/* Document preview */}
        <div className="card">
          <div className="card-title"><Icon name="FileText" size={14} sx={{ marginRight: 6 }} />Tài liệu nộp</div>
          <div style={{ marginBottom: 12, fontSize: "0.875rem", color: "#64748b" }}>
            {submission.original_filename || submission.title}
            {submission.is_late ? (
              <span className="badge badge-danger" style={{ marginLeft: 8 }}><Icon name="AlertTriangle" size={12} /> Nộp trễ</span>
            ) : (
              <span className="badge badge-success" style={{ marginLeft: 8 }}><Icon name="Clock" size={12} /> Đúng hạn</span>
            )}
          </div>
          {submission.file_path?.endsWith(".pdf") ? (
            <iframe src={fileUrl} style={{ width: "100%", height: "600px", border: "1px solid #e2e8f0", borderRadius: 8 }} title="Document preview" />
          ) : (
            <div style={{ padding: 40, textAlign: "center", background: "#f8fafc", borderRadius: 8 }}>
              <Icon name="FileText" size={48} sx={{ opacity: 0.3, margin: "0 auto 12px" }} />
              <p>File: {submission.original_filename || submission.title}</p>
              <a href={fileUrl} className="btn btn-primary btn-sm" style={{ marginTop: 12 }} download>Tải xuống</a>
            </div>
          )}
        </div>

        {/* Feedback panel — minWidth 0 để text dài không phá lưới grid */}
        <div style={{ minWidth: 0 }}>
          <div className="card">
            <div className="card-title">Phản hồi từ giảng viên</div>
            {feedbacksList.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center", padding: "20px 0" }}>
                Chưa có phản hồi
              </p>
            ) : (
              feedbacksList.map((f) => {
                const age = Date.now() - new Date(f.created_at).getTime();
                const isNew = age < 24 * 60 * 60 * 1000;
                return (
                  <div key={f.id} style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {f.supervisor_name}
                        {isNew && <span className="badge badge-info" style={{ marginLeft: 6 }}>Mới</span>}
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        {new Date(f.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <p style={feedbackTextStyle}>{f.content}</p>
                    <button className="btn btn-sm btn-secondary" style={{ marginTop: 8 }}
                      onClick={() => summarize(f.id, f.content)} disabled={summarizing === f.id}>
                      <Icon name="Sparkles" size={13} />
                      {summarizing === f.id ? "..." : summaryMap[f.id] ? "Tóm tắt lại" : "Tóm tắt AI"}
                    </button>
                    {(summaryMap[f.id] || f.ai_summary) && (
                      <div
                        style={{
                          background: "#eff6ff",
                          borderRadius: 6,
                          padding: 8,
                          marginTop: 8,
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <strong style={{ fontSize: "0.78rem", color: "#1e40af", flexShrink: 0 }}>Tóm tắt:</strong>
                        <div style={aiSummaryScrollStyle}>
                          {displayAiSummary(summaryMap[f.id] || f.ai_summary)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
              <div><strong>Tiêu đề:</strong> {submission.title}</div>
              <div><strong>Mốc:</strong> {submission.milestone_name || "—"}</div>
              <div><strong>Nhóm:</strong> {submission.team_name}</div>
              <div><strong>Ngày nộp:</strong> {new Date(submission.version_submitted_at || submission.submitted_at).toLocaleString("vi-VN")}</div>
              <div><strong>Phiên bản:</strong> {Number.isFinite(Number(submission.version_number)) ? Number(submission.version_number) : submission.version_number}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
