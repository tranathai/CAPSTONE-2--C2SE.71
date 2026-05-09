import { useState, useEffect } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { topics } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";

export default function MentorTopics() {
  const { toast, showToast } = useToast();
  const [pending, setPending] = useState([]);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    topics.pending().then(setPending).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    try {
      await topics.approve(id);
      showToast("Duyệt đề tài thành công!", "success");
      setPending((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) { showToast("Lý do từ chối không được trống", "error"); return; }
    try {
      await topics.reject(id, rejectReason);
      showToast("Từ chối đề tài", "success");
      setPending((prev) => prev.filter((t) => t.id !== id));
      setRejectingId(null);
      setRejectReason("");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <h1>Duyệt đề tài</h1>
        <p>Xem và duyệt đề tài từ các nhóm sinh viên</p>
      </div>

      {pending.length === 0 ? (
        <div className="card empty-state">
          <Icon name="CheckCircle" size={48} sx={{ opacity: 0.3 }} />
          <h3>Không có đề tài chờ duyệt</h3>
          <p>Tất cả đề tài đã được xử lý</p>
        </div>
      ) : (
        pending.map((t) => (
          <div key={t.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{t.title}</h3>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 4 }}>
                  Nhóm: {t.team_name} • <Icon name="Group" size={12} sx={{ marginRight: 3 }} /> {t.member_count} thành viên
                </div>
                {t.leader_name && <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Trưởng nhóm: {t.leader_name}</div>}
              </div>
              <span className="badge badge-warning"><Icon name="Schedule" size={12} /> Chờ duyệt</span>
            </div>

            {t.description && (
              <div style={{ marginBottom: 10, fontSize: "0.875rem", color: "#475569" }}>
                <strong>Mô tả:</strong> {t.description}
              </div>
            )}
            {t.technologies && (
              <div style={{ marginBottom: 10, fontSize: "0.875rem", color: "#475569" }}>
                <strong>Công nghệ:</strong> {t.technologies}
              </div>
            )}

            {rejectingId === t.id ? (
              <div style={{ marginTop: 12, padding: 12, background: "#fef2f2", borderRadius: 8 }}>
                <div className="form-group">
                  <label>Lý do từ chối *</label>
                  <textarea className="form-input" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do..." style={{ minHeight: 60 }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-danger btn-sm" onClick={() => handleReject(t.id)}>Xác nhận từ chối</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setRejectingId(null); setRejectReason(""); }}>Hủy</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn btn-success btn-sm" onClick={() => handleApprove(t.id)}>
                  <Icon name="CheckCircle" size={14} /> Duyệt
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setRejectingId(t.id)}>
                  <Icon name="Cancel" size={14} /> Từ chối
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
