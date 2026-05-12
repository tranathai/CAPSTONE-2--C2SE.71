import { useState, useEffect, useCallback, useMemo } from "react";
import AddIcon from "@mui/icons-material/Add";
import Icon from "../../components/UI/Icon.jsx";
import { topics, teams } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";
import "./Topic.css";

export default function StudentTopic() {
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [myTeams, setMyTeams] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    technologies: "",
    team_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast, showToast } = useToast();

  const loadTopic = useCallback(() => {
    return topics.myTopic().then(setTopic);
  }, []);

  useEffect(() => {
    loadTopic().catch(() => {}).finally(() => setLoading(false));
  }, [loadTopic]);

  const openModal = async (prefillFromTopic = null) => {
    setModalOpen(true);
    try {
      const list = await teams.joined();
      setMyTeams(list);
      const selectable = list.filter((t) => t.can_register_topic);
      const defaultTeam =
        prefillFromTopic?.team_id != null
          ? String(prefillFromTopic.team_id)
          : selectable.length === 1
            ? String(selectable[0].id)
            : "";
      setForm({
        title: prefillFromTopic?.title ?? "",
        description: prefillFromTopic?.description ?? "",
        technologies: prefillFromTopic?.technologies ?? "",
        team_id: defaultTeam,
      });
    } catch {
      showToast("Không tải được danh sách nhóm", "error");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast("Tên đề tài không được trống", "error");
      return;
    }
    const selectable = myTeams.filter((t) => t.can_register_topic);
    if (selectable.length > 0 && !form.team_id) {
      showToast("Vui lòng chọn nhóm", "error");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        technologies: form.technologies.trim() || undefined,
      };
      if (form.team_id) payload.team_id = Number(form.team_id);

      await topics.register(payload);
      showToast("Đăng ký thành công — đang chờ giảng viên duyệt", "success");
      await loadTopic();
      closeModal();
    } catch (err) {
      showToast(err.message || "Đăng ký thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!topic) return;
    if (!confirm("Bạn chắc chắn muốn xóa đề tài hiện tại?")) return;
    setDeleting(true);
    try {
      await topics.removeMyTopic();
      showToast("Đã xóa đề tài", "success");
      await loadTopic();
    } catch (err) {
      showToast(err.message || "Xóa đề tài thất bại", "error");
    } finally {
      setDeleting(false);
    }
  };

  const canRegister =
    topic?.can_register_new_topic !== undefined && topic?.can_register_new_topic !== null
      ? Boolean(topic.can_register_new_topic)
      : !topic || topic.status === "rejected";

  const registerBlockedReason = useMemo(() => {
    if (topic?.registration_block_reason) return topic.registration_block_reason;
    if (!topic) return "";
    if (topic.status === "approved") {
      return "Đề tài đã được duyệt — không thể đăng ký đề tài mới cho nhóm này.";
    }
    if (topic.status === "pending") {
      return "Đề tài đang chờ giảng viên duyệt.";
    }
    return "";
  }, [topic]);

  const StatusBadge = () => {
    if (!topic) return null;
    if (topic.status === "approved") {
      return (
        <span className="badge badge-success">
          <Icon name="CheckCircle" size={12} /> Đã duyệt
        </span>
      );
    }
    if (topic.status === "rejected") {
      return (
        <span className="badge badge-danger">
          <Icon name="XCircle" size={12} /> Từ chối
        </span>
      );
    }
    return (
      <span className="badge badge-warning">
        <Icon name="Clock" size={12} /> Chờ duyệt
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  const selectableTeams = myTeams.filter((t) => t.can_register_topic);

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="student-topic-toolbar">
        <div className="page-header student-topic-heading">
          <h1>Đăng ký đề tài</h1>
          <p>Đăng ký đề tài capstone/đồ án của bạn</p>
        </div>
        <div className="student-topic-toolbar-actions">
          <button
            type="button"
            className={`student-topic-register-btn btn btn-primary${canRegister ? "" : " student-topic-register-btn--blocked"}`}
            title={canRegister ? "Đăng ký đề tài mới" : registerBlockedReason}
            aria-disabled={!canRegister}
            onClick={() => {
              if (!canRegister) {
                showToast(registerBlockedReason, "info");
                return;
              }
              openModal(null);
            }}
          >
            <AddIcon sx={{ fontSize: 20 }} aria-hidden />
            Đăng ký đề tài mới
          </button>
          {topic && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteTopic}
              disabled={deleting}
              style={{ marginLeft: 8 }}
            >
              <Icon name="Trash" size={14} /> {deleting ? "Đang xóa..." : "Xóa đề tài"}
            </button>
          )}
        </div>
      </div>

      {topic ? (
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
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
              <button type="button" className="btn btn-primary" onClick={() => openModal(topic)}>
                Đăng ký lại
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card empty-state">
          <Icon name="Folder" size={48} sx={{ opacity: 0.3 }} />
          <h3>Chưa đăng ký đề tài</h3>
          <p>Nhấn &quot;Đăng ký đề tài mới&quot; ở trên để gửi đơn đăng ký.</p>
        </div>
      )}

      {modalOpen && (
        <div className="topic-modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="topic-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="topic-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="topic-modal-header">
              <h2 id="topic-modal-title" className="topic-modal-title">
                Đăng ký đề tài mới
              </h2>
              <button type="button" className="topic-modal-close" onClick={closeModal} aria-label="Đóng">
                <Icon name="Close" size={20} />
              </button>
            </div>
            <div className="topic-modal-body">
              <form onSubmit={handleSubmit}>
                {myTeams.length > 0 && (
                  <div className="form-group">
                    <label htmlFor="topic-team">Chọn nhóm *</label>
                    <select
                      id="topic-team"
                      className="form-input"
                      value={form.team_id}
                      onChange={(e) => setForm((f) => ({ ...f, team_id: e.target.value }))}
                      required={selectableTeams.length > 0}
                      disabled={selectableTeams.length === 0}
                    >
                      <option value="">
                        {selectableTeams.length === 0 ? "— Không có nhóm hợp lệ —" : "— Chọn nhóm —"}
                      </option>
                      {selectableTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="topic-title">Tên đề tài *</label>
                  <input
                    id="topic-title"
                    className="form-input"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="VD: Hệ thống quản lý đồ án với AI"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="topic-desc">Mô tả</label>
                  <textarea
                    id="topic-desc"
                    className="form-input"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Mô tả chi tiết đề tài..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="topic-tech">Công nghệ</label>
                  <input
                    id="topic-tech"
                    className="form-input"
                    value={form.technologies}
                    onChange={(e) => setForm((f) => ({ ...f, technologies: e.target.value }))}
                    placeholder="VD: React, Node.js, MySQL"
                  />
                </div>
                {selectableTeams.length === 0 && myTeams.length > 0 && (
                  <p style={{ color: "#b45309", fontSize: "0.875rem" }}>
                    Các nhóm của bạn đã có đề tài chờ duyệt hoặc đã duyệt. Không thể đăng ký thêm cho nhóm đó.
                  </p>
                )}
                {myTeams.length === 0 && (
                  <p style={{ color: "#b45309", fontSize: "0.875rem" }}>
                    Bạn chưa thuộc nhóm nào. Hãy vào trang Nhóm để được thêm vào nhóm trước.
                  </p>
                )}
                <div className="topic-modal-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      submitting ||
                      myTeams.length === 0 ||
                      selectableTeams.length === 0 ||
                      (selectableTeams.length > 1 && !form.team_id)
                    }
                  >
                    {submitting ? "Đang gửi..." : "Gửi đăng ký"}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
