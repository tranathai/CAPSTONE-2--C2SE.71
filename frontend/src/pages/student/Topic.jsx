import { useState, useEffect, useCallback, useMemo } from "react";
import AddIcon from "@mui/icons-material/Add";
import Icon from "../../components/UI/Icon.jsx";
import ConfirmModal from "../../components/UI/ConfirmModal.jsx";
import { topics, teams } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";
import "./Topic.css";

function TopicStatusBadge({ topic }) {
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
}

/** Một dòng theo nhóm: có hoặc chưa có đề tài (API GET /topics/my) */
function normalizeTopicSlots(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return [
    {
      team_id: raw.team_id,
      team_name: raw.team_name || "",
      topic: raw.id ? raw : null,
      can_register_new_topic: Boolean(raw.can_register_new_topic),
      registration_block_reason: raw.registration_block_reason || "",
    },
  ];
}

export default function StudentTopic() {
  const [topicSlots, setTopicSlots] = useState([]);
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState(null);
  const { toast, showToast } = useToast();

  const loadTopic = useCallback(() => {
    return topics.myTopic().then((data) => setTopicSlots(normalizeTopicSlots(data)));
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
    if (deleteTeamId == null) return;
    setDeleting(true);
    try {
      await topics.removeMyTopic(deleteTeamId);
      showToast("Đã xóa đề tài", "success");
      setShowDeleteConfirm(false);
      setDeleteTeamId(null);
      await loadTopic();
    } catch (err) {
      showToast(err.message || "Xóa đề tài thất bại", "error");
    } finally {
      setDeleting(false);
    }
  };

  const canRegister = useMemo(() => {
    return topicSlots.some((s) => s.can_register_new_topic);
  }, [topicSlots]);

  const registerBlockedReason = useMemo(() => {
    if (canRegister) return "";
    const first = topicSlots.find((s) => !s.can_register_new_topic && s.registration_block_reason);
    if (first?.registration_block_reason) return first.registration_block_reason;
    const pend = topicSlots.find((s) => s.topic?.status === "pending");
    if (pend) return "Ít nhất một nhóm đang chờ duyệt đề tài.";
    const appr = topicSlots.find((s) => s.topic?.status === "approved");
    if (appr) return "Tất cả nhóm hiển thị đã có đề tài được duyệt hoặc đang chờ — không thể đăng ký mới cho nhóm đó.";
    return "Hiện không thể đăng ký đề tài mới.";
  }, [topicSlots, canRegister]);

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

      <ConfirmModal
        open={showDeleteConfirm}
        title="Xóa đề tài"
        message="Bạn chắc chắn muốn xóa đề tài của nhóm này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa đề tài"
        cancelLabel="Hủy"
        danger
        busy={deleting}
        onCancel={() => {
          if (!deleting) {
            setShowDeleteConfirm(false);
            setDeleteTeamId(null);
          }
        }}
        onConfirm={handleDeleteTopic}
      />

      <div className="student-topic-toolbar">
        <div className="page-header student-topic-heading">
          <h1>Đăng ký đề tài</h1>
          <p>Đăng ký đề tài capstone/đồ án theo từng nhóm</p>
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
        </div>
      </div>

      {!topicSlots.length ? (
        <div className="card empty-state">
          <Icon name="Folder" size={48} sx={{ opacity: 0.3 }} />
          <h3>Chưa thuộc nhóm nào</h3>
          <p>Khi được thêm vào nhóm, bạn sẽ đăng ký đề tài tại đây.</p>
        </div>
      ) : (
        topicSlots.map((slot) => (
          <div key={slot.team_id} className="card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: 10 }}>
              <strong>Nhóm:</strong> {slot.team_name}
            </p>
            {!slot.topic ? (
              <div className="empty-state" style={{ padding: "20px 0", textAlign: "center" }}>
                <Icon name="Folder" size={40} sx={{ opacity: 0.25 }} />
                <h3 style={{ fontSize: "1rem", marginTop: 8 }}>Chưa đăng ký đề tài</h3>
                <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
                  {slot.can_register_new_topic
                    ? "Nhấn \"Đăng ký đề tài mới\" ở trên và chọn nhóm này."
                    : slot.registration_block_reason || "Không thể đăng ký đề tài cho nhóm này lúc này."}
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{slot.topic.title}</h2>
                  </div>
                  <TopicStatusBadge topic={slot.topic} />
                </div>
                {slot.topic.description && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>Mô tả:</strong>
                    <p style={{ color: "#475569", marginTop: 4 }}>{slot.topic.description}</p>
                  </div>
                )}
                {slot.topic.technologies && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>Công nghệ:</strong>
                    <p style={{ color: "#475569", marginTop: 4 }}>{slot.topic.technologies}</p>
                  </div>
                )}
                {slot.topic.supervisor_name && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>Giảng viên hướng dẫn:</strong> {slot.topic.supervisor_name}
                  </div>
                )}
                {slot.topic.status === "rejected" && slot.topic.rejection_reason && (
                  <div style={{ background: "#fef2f2", padding: 12, borderRadius: 8, marginTop: 12 }}>
                    <strong style={{ color: "#dc2626" }}>Lý do từ chối:</strong>
                    <p style={{ color: "#991b1b", marginTop: 4 }}>{slot.topic.rejection_reason}</p>
                  </div>
                )}
                <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {slot.topic.status === "rejected" && (
                    <button type="button" className="btn btn-primary" onClick={() => openModal({ ...slot.topic, team_id: slot.team_id })}>
                      Đăng ký lại
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setDeleteTeamId(slot.team_id);
                      setShowDeleteConfirm(true);
                    }}
                    disabled={deleting}
                  >
                    <Icon name="Trash" size={14} /> Xóa đề tài nhóm này
                  </button>
                </div>
              </>
            )}
          </div>
        ))
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
