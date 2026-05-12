import { useState, useEffect } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { submissions, feedbacks } from "../../lib/api.js";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast.js";
import { ai } from "../../lib/api.js";

export default function StudentFeedback() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [history, setHistory] = useState([]);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [summarizing, setSummarizing] = useState(null);
  const [summaryMap, setSummaryMap] = useState({});

  useEffect(() => {
    submissions.my().then(setHistory).catch(() => {});
  }, []);

  const loadFeedbacks = async (versionId, submissionId) => {
    if (feedbackMap[versionId]) {
      setFeedbackMap((prev) => ({ ...prev, [versionId]: null }));
      return;
    }
    try {
      const data = await feedbacks.byVersion(versionId);
      setFeedbackMap((prev) => ({ ...prev, [versionId]: data }));
    } catch { showToast("Không tải được phản hồi", "error"); }
  };

  const summarize = async (feedbackId, content) => {
    if (summaryMap[feedbackId]) {
      setSummaryMap((prev) => ({ ...prev, [feedbackId]: null }));
      return;
    }
    setSummarizing(feedbackId);
    try {
      const result = await ai.summarize(content);
      setSummaryMap((prev) => ({ ...prev, [feedbackId]: result.summary }));
    } catch (err) {
      showToast("Tính năng AI tạm thời không khả dụng", "error");
    } finally {
      setSummarizing(null);
    }
  };

  const visibleFeedbacks = history.filter((s) => s.has_final_feedback || s.has_feedback);

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <h1>Phản hồi từ giảng viên</h1>
        <p>Xem phản hồi sau khi giảng viên nộp feedback chính thức</p>
      </div>

      {visibleFeedbacks.length === 0 ? (
        <div className="card empty-state">
          <Icon name="MessageSquare" size={48} sx={{ opacity: 0.3 }} />
          <h3>Chưa có phản hồi nào</h3>
          <p>Phản hồi sẽ hiển thị khi giảng viên gửi góp ý cho bài nộp</p>
        </div>
      ) : (
        visibleFeedbacks.map((s) => (
          <div key={s.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <strong>{s.title}</strong>
                <span style={{ marginLeft: 8, color: "#64748b", fontSize: "0.8rem" }}>
                  {s.milestone_name} • {Number.isFinite(Number(s.version_number)) ? Number(s.version_number) : s.version_number}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-sm btn-secondary" onClick={() => loadFeedbacks(s.version_id, s.id)}>
                  <Icon name="Eye" size={14} /> Xem phản hồi
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/student/review/${s.id}`)}>
                  Chi tiết
                </button>
              </div>
            </div>

            {feedbackMap[s.version_id] && (
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, marginTop: 8 }}>
                {feedbackMap[s.version_id].map((f) => {
                  const age = Date.now() - new Date(f.created_at).getTime();
                  const isNew = age < 24 * 60 * 60 * 1000;
                  return (
                    <div key={f.id} style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {f.supervisor_name} • {new Date(f.created_at).toLocaleString("vi-VN")}
                          {isNew && <span className="badge badge-info" style={{ marginLeft: 8 }}>Mới</span>}
                          {f.updated_at !== f.created_at && <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "#94a3b8" }}>(Đã chỉnh sửa)</span>}
                        </div>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => summarize(f.id, f.content)}
                          disabled={summarizing === f.id}
                        >
                          <Icon name="Sparkles" size={14} /> {summarizing === f.id ? "Đang tóm tắt..." : "Tóm tắt AI"}
                        </button>
                      </div>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#334155" }}>{f.content}</p>
                      {summaryMap[f.id] && (
                        <div style={{ background: "#eff6ff", borderRadius: 8, padding: 10, marginTop: 8 }}>
                          <strong style={{ fontSize: "0.8rem", color: "#1e40af" }}>Tóm tắt AI:</strong>
                          <p style={{ fontSize: "0.875rem", color: "#1e3a8a", marginTop: 4, lineHeight: 1.5 }}>{summaryMap[f.id]}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
