import { useState, useEffect } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { topics } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";

export default function StudentTopic() {
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", technologies: "" });
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    topics.myTopic().then((t) => { setTopic(t); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { showToast("Tên đề tài không được trống", "error"); return; }
    setSubmitting(true);
    try {
      await topics.register(form);
      showToast("Đăng ký đề tài thành công!", "success");
      const t = await topics.myTopic();
      setTopic(t);
      setShowForm(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const StatusBadge = () => {
    if (!topic) return null;
    if (topic.status === "approved") return <span className="badge badge-success"><Icon name="CheckCircle" size={12} /> Đã duyệt</span>;
    if (topic.status === "rejected") return <span className="badge badge-danger"><Icon name="XCircle" size={12} /> Từ chối</span>;
    return <span className="badge badge-warning"><Icon name="Clock" size={12} /> Chờ duyệt</span>;
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <h1>Đăng ký đề tài</h1>
        <p>Đăng ký đề tài capstone/đồ án của bạn</p>
      </div>

      {topic ? (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{topic.title}</h2>
              <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 4 }}>
                Nhóm: {topic.team_name}
              </p>
            </div>
            <StatusBadge />
          </div>
          {topic.description && (
            <div style={{ marginBottom: 12 }}>
              <strong>Mô tả:</strong>
              <p style={{ color: "#475569", marginTop: 4 }}>{topic.description}</p>
            </div>
          )}
          {topic.technologies && (
            <div style={{ marginBottom: 12 }}>
              <strong>Công nghệ:</strong>
              <p style={{ color: "#475569", marginTop: 4 }}>{topic.technologies}</p>
            </div>
          )}
          {topic.supervisor_name && (
            <div style={{ marginBottom: 12 }}>
              <strong>Giảng viên hướng dẫn:</strong> {topic.supervisor_name}
            </div>
          )}
          {topic.status === "rejected" && topic.rejection_reason && (
            <div style={{ background: "#fef2f2", padding: 12, borderRadius: 8, marginTop: 12 }}>
              <strong style={{ color: "#dc2626" }}>Lý do từ chối:</strong>
              <p style={{ color: "#991b1b", marginTop: 4 }}>{topic.rejection_reason}</p>
            </div>
          )}
          {topic.status === "rejected" && (
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => { setForm({ title: topic.title, description: topic.description || "", technologies: topic.technologies || "" }); setShowForm(true); }}>
                Đăng ký lại
              </button>
            </div>
          )}
        </div>
      ) : showForm ? (
        <div className="card">
          <div className="card-title">Đăng ký đề tài mới</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tên đề tài *</label>
              <input className="form-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="VD: Hệ thống quản lý đồ án với AI" />
            </div>
            <div className="form-group">
              <label>Mô tả</label>
              <textarea className="form-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả chi tiết đề tài..." />
            </div>
            <div className="form-group">
              <label>Công nghệ sử dụng</label>
              <input className="form-input" value={form.technologies} onChange={(e) => setForm((f) => ({ ...f, technologies: e.target.value }))} placeholder="VD: React, Node.js, MySQL" />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Đang gửi..." : "Gửi đăng ký"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card empty-state">
          <Icon name="Error" size={48} sx={{ opacity: 0.3 }} />
          <h3>Chưa đăng ký đề tài</h3>
          <p>Đăng ký đề tài để bắt đầu dự án</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
            Đăng ký đề tài
          </button>
        </div>
      )}
    </div>
  );
}
