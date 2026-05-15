import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Icon from "../../components/UI/Icon.jsx";
import ConfirmModal from "../../components/UI/ConfirmModal.jsx";
import { submissions, milestones, teams, topics } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";
import { useNavigate } from "react-router-dom";
import StudentRequiredDocumentSelect, {
  parseMilestoneRequiredDocs,
} from "../../components/student/StudentRequiredDocumentSelect.jsx";
import { notifyStudentSubmissionsChanged } from "../../lib/studentSubmissionEvents.js";

function normalizeTopicSlots(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw.id) {
    return [
      {
        team_id: raw.team_id,
        team_name: raw.team_name || "",
        topic: raw,
      },
    ];
  }
  return [];
}

export default function StudentSubmissions() {
  const [myTeams, setMyTeams] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [topicSlots, setTopicSlots] = useState([]);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [history, setHistory] = useState([]);
  const [milestoneList, setMilestoneList] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [file, setFile] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [editDocument, setEditDocument] = useState("");
  const [versionUploadSubmissionId, setVersionUploadSubmissionId] = useState(null);
  const [uploadingVersionForId, setUploadingVersionForId] = useState(null);
  const versionFileRef = useRef(null);
  const [deleteVersionId, setDeleteVersionId] = useState(null);
  const { toast, showToast } = useToast();
  const navigate = useNavigate();

  const refreshSubmissionHistory = useCallback(async () => {
    if (!activeTeamId) {
      setHistory([]);
      return;
    }
    try {
      setHistory(await submissions.myByTeam(activeTeamId));
    } catch {
      setHistory(await submissions.my());
    }
  }, [activeTeamId]);

  useEffect(() => {
    Promise.all([teams.myTeam(), topics.myTopic(), milestones.list()])
      .then(([teamsData, slotsRaw, ms]) => {
        const arr = Array.isArray(teamsData) ? teamsData : teamsData ? [teamsData] : [];
        setMyTeams(arr);
        setTopicSlots(normalizeTopicSlots(slotsRaw));
        setMilestoneList(ms);
        setActiveTeamId(arr[0]?.id ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeTeamId) {
      setCurrentTopic(null);
      setHistory([]);
      return;
    }
    const slot = topicSlots.find((s) => Number(s.team_id) === Number(activeTeamId));
    setCurrentTopic(slot?.topic || null);
    refreshSubmissionHistory();
  }, [activeTeamId, topicSlots, refreshSubmissionHistory]);

  const activeTeam = useMemo(
    () => myTeams.find((t) => Number(t.id) === Number(activeTeamId)) || null,
    [myTeams, activeTeamId],
  );

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { showToast("Vui lòng chọn file", "error"); return; }
    if (!selectedMilestone) { showToast("Vui lòng chọn mốc thời gian", "error"); return; }
    if (!activeTeam) { showToast("Bạn chưa thuộc nhóm nào", "error"); return; }
    const milestoneDocs = parseMilestoneRequiredDocs(selectedMilestoneMeta);
    if (milestoneDocs.length === 0) {
      showToast("Mốc này chưa có danh sách tài liệu cần nộp. Liên hệ admin.", "error");
      return;
    }
    if (!selectedDocument?.trim()) {
      showToast("Vui lòng chọn tài liệu cần nộp", "error");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("team_id", activeTeam.id);
    formData.append("milestone_id", selectedMilestone);
    formData.append("title", selectedDocument.trim());

    try {
      await submissions.studentUpload(formData);
      showToast("Upload thành công!", "success");
      setShowUpload(false);
      setSelectedMilestone("");
      setFile(null);
      setSelectedDocument("");
      await refreshSubmissionHistory();
      notifyStudentSubmissionsChanged();
    } catch (err) {
      showToast(err.message || "Upload thất bại", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleEditDocument = async (submissionId) => {
    if (!editDocument.trim()) {
      showToast("Vui lòng chọn tài liệu", "error");
      return;
    }
    try {
      await submissions.update(submissionId, { title: editDocument.trim() });
      showToast("Cập nhật thành công!", "success");
      setEditingSubmission(null);
      setEditDocument("");
      await refreshSubmissionHistory();
      notifyStudentSubmissionsChanged();
    } catch (err) {
      showToast(err.message || "Cập nhật thất bại", "error");
    }
  };

  const handlePickNewVersion = (submissionId) => {
    setVersionUploadSubmissionId(submissionId);
    requestAnimationFrame(() => versionFileRef.current?.click());
  };

  const handleVersionFileChange = async (e) => {
    const file = e.target.files?.[0];
    const sid = versionUploadSubmissionId;
    e.target.value = "";
    setVersionUploadSubmissionId(null);
    if (!file || !sid) return;

    setUploadingVersionForId(sid);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("submission_id", String(sid));
    try {
      await submissions.studentUploadVersion(formData);
      showToast("Đã cập nhật phiên bản mới", "success");
      await refreshSubmissionHistory();
      notifyStudentSubmissionsChanged();
    } catch (err) {
      showToast(err.message || "Cập nhật phiên bản thất bại", "error");
    } finally {
      setUploadingVersionForId(null);
    }
  };

  const executeDeleteVersion = async () => {
    if (deleteVersionId == null) return;
    const vid = deleteVersionId;
    try {
      await submissions.deleteVersion(vid);
      showToast("Xóa thành công!", "success");
      setDeleteVersionId(null);
      await refreshSubmissionHistory();
      notifyStudentSubmissionsChanged();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Xóa thất bại";
      showToast(msg, "error");
    }
  };

  const StatusBadge = ({ isLate, hasFeedback }) => {
    if (hasFeedback) return <span className="badge badge-success"><Icon name="CheckCircle" size={12} /> Đã phản hồi</span>;
    if (isLate) return <span className="badge badge-danger"><Icon name="AlertTriangle" size={12} /> Trễ</span>;
    return <span className="badge badge-warning"><Icon name="Clock" size={12} /> Chờ phản hồi</span>;
  };

  const projectMilestones = useMemo(() => {
    const selected = Array.isArray(currentTopic?.selected_milestone_ids)
      ? currentTopic.selected_milestone_ids.map((x) => Number(x)).filter((x) => x > 0)
      : [];
    const source =
      selected.length > 0
        ? milestoneList.filter((m) => selected.includes(Number(m.id)))
        : milestoneList;

    const normalize = (v) => String(v || "").trim().toLowerCase();
    const wanted = ["proposal", "mid-term report", "final report"];
    const picked = wanted
      .map((name) => source.find((m) => normalize(m.name) === name))
      .filter(Boolean);

    if (picked.length === 3) return picked;
    return [...source]
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .slice(0, 3);
  }, [milestoneList, currentTopic?.selected_milestone_ids]);

  const allowedMilestones = useMemo(() => {
    const selected = Array.isArray(currentTopic?.selected_milestone_ids)
      ? currentTopic.selected_milestone_ids.map((x) => Number(x)).filter((x) => x > 0)
      : [];
    if (selected.length === 0) return milestoneList;
    return milestoneList.filter((m) => selected.includes(Number(m.id)));
  }, [milestoneList, currentTopic?.selected_milestone_ids]);

  const selectedMilestoneMeta = useMemo(() => {
    if (!selectedMilestone) return null;
    return milestoneList.find((m) => String(m.id) === String(selectedMilestone)) || null;
  }, [milestoneList, selectedMilestone]);

  const selectedMilestoneDocs = useMemo(
    () => parseMilestoneRequiredDocs(selectedMilestoneMeta),
    [selectedMilestoneMeta],
  );

  const getDocsForSubmission = useCallback(
    (sub) => {
      const m = milestoneList.find((x) => Number(x.id) === Number(sub?.milestone_id));
      return parseMilestoneRequiredDocs(m);
    },
    [milestoneList],
  );

  const getMilestoneState = (m) => {
    const now = new Date();
    const start = m?.start_date ? new Date(m.start_date) : null;
    const end = m?.end_date ? new Date(m.end_date) : null;
    if (end && now > end) return { label: "Đã qua hạn", className: "badge-danger", icon: "AlertTriangle" };
    if (start && now >= start) return { label: "Đang diễn ra", className: "badge-warning", icon: "Clock" };
    return { label: "Sắp tới", className: "badge-success", icon: "CheckCircle" };
  };

  // Group submissions by milestone
  const groupedByMilestone = history.reduce((acc, sub) => {
    const milestoneId = sub.milestone_id || 'no-milestone';
    if (!acc[milestoneId]) {
      acc[milestoneId] = {
        milestone: milestoneList.find(m => m.id === sub.milestone_id) || { name: 'Không có mốc', end_date: null },
        submissions: []
      };
    }
    acc[milestoneId].submissions.push(sub);
    return acc;
  }, {});

  const topicApproved = currentTopic?.status === "approved";

  return (
    <div className="page-container">
      <input
        ref={versionFileRef}
        type="file"
        accept=".pdf,.docx,.doc"
        style={{ display: "none" }}
        aria-hidden
        onChange={handleVersionFileChange}
      />
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <ConfirmModal
        open={deleteVersionId != null}
        title="Xóa phiên bản nộp"
        message="Bạn có chắc muốn xóa phiên bản tệp này? Không thể hoàn tác."
        confirmLabel="Xóa phiên bản"
        cancelLabel="Hủy"
        danger
        onCancel={() => setDeleteVersionId(null)}
        onConfirm={executeDeleteVersion}
      />

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>Nộp bài</h1>
          <p>Upload báo cáo theo từng mốc thời gian</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {myTeams.length > 1 && (
            <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
              <label htmlFor="sub-team" style={{ fontSize: "0.75rem" }}>Nhóm</label>
              <select
                id="sub-team"
                className="form-input"
                value={activeTeamId ?? ""}
                onChange={(e) => setActiveTeamId(Number(e.target.value))}
              >
                {myTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        <button
          className="btn btn-primary"
          disabled={!topicApproved}
          title={!topicApproved ? "Đề tài cần được duyệt trước khi nộp bài" : "Nộp bài mới"}
          onClick={() => {
            if (!topicApproved) {
              showToast("Đề tài cần được duyệt trước khi nộp bài", "info");
              return;
            }
            setShowUpload((v) => !v);
            setSelectedMilestone("");
            setFile(null);
            setSelectedDocument("");
          }}
        >
          <Icon name="Upload" size={16} /> Nộp bài mới
        </button>
        </div>
      </div>

      {!topicApproved && (
        <div className="card empty-state" style={{ marginBottom: 20 }}>
          <Icon name="Folder" size={48} sx={{ opacity: 0.3 }} />
          <h3>Chưa có mốc thời gian</h3>
          <p>Đề tài của bạn cần được giảng viên duyệt trước khi hiển thị mốc và nộp bài.</p>
        </div>
      )}

      {topicApproved && projectMilestones.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Mốc thời gian dự án</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            {projectMilestones.map((m) => {
              const state = getMilestoneState(m);
              return (
                <div
                  key={m.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: 12,
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{m.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 8 }}>
                    {m.start_date ? new Date(m.start_date).toLocaleDateString("vi-VN") : "--"} -{" "}
                    {m.end_date ? new Date(m.end_date).toLocaleDateString("vi-VN") : "--"}
                  </div>
                  <span className={`badge ${state.className}`}>
                    <Icon name={state.icon} size={12} /> {state.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {topicApproved && showUpload && (
        <div className="card">
          <div className="card-title">Upload bài nộp mới</div>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label>Mốc thời gian *</label>
              <select
                className="form-input"
                value={selectedMilestone}
                onChange={(e) => {
                  setSelectedMilestone(e.target.value);
                  setSelectedDocument("");
                }}
              >
                <option value="">-- Chọn mốc thời gian --</option>
                {allowedMilestones.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {selectedMilestoneMeta && (
              <div
                className="form-group"
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "12px 14px",
                  background: "#f8fafc",
                }}
              >
                <label style={{ marginBottom: 8, display: "block", fontWeight: 600 }}>
                  Tài liệu cần nộp — {selectedMilestoneMeta.name}
                </label>
                <StudentRequiredDocumentSelect
                  options={selectedMilestoneDocs}
                  value={selectedDocument}
                  onChange={setSelectedDocument}
                  disabled={uploading}
                />
              </div>
            )}

            <div className="form-group">
              <label>File (.pdf, .docx, .doc) - tối đa 10MB *</label>
              <input type="file" accept=".pdf,.docx,.doc" onChange={(e) => setFile(e.target.files[0])} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                {uploading ? "Đang upload..." : "Gửi bài"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowUpload(false);
                  setSelectedMilestone("");
                  setFile(null);
                  setSelectedDocument("");
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {topicApproved && Object.keys(groupedByMilestone).length === 0 ? (
        <div className="card empty-state">
          <Icon name="FileText" size={48} sx={{ opacity: 0.3 }} />
          <h3>Chưa có bài nộp nào</h3>
          <p>Nhấn "Nộp bài mới" để bắt đầu</p>
        </div>
      ) : topicApproved ? (
        Object.entries(groupedByMilestone).map(([milestoneId, { milestone, submissions }]) => (
          <div key={milestoneId} className="card" style={{ marginBottom: 20 }}>
            <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{milestone.name}</span>
              {milestone.end_date && (
                <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
                  Hạn: {new Date(milestone.end_date).toLocaleDateString("vi-VN")}
                </span>
              )}
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tài liệu</th>
                  <th>Ngày nộp</th>
                  <th>Phiên bản</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {editingSubmission === s.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200 }}>
                          <StudentRequiredDocumentSelect
                            options={getDocsForSubmission(s)}
                            value={editDocument}
                            onChange={setEditDocument}
                          />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" className="btn btn-sm btn-success" onClick={() => handleEditDocument(s.id)}>
                              <span aria-hidden>✓</span>
                            </button>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditingSubmission(null)}>
                              <span aria-hidden>✗</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <strong>{s.title}</strong>
                      )}
                    </td>
                    <td>{new Date(s.version_submitted_at || s.submitted_at).toLocaleDateString("vi-VN")}</td>
                    <td>{Number.isFinite(Number(s.version_number)) ? Number(s.version_number) : s.version_number}</td>
                    <td><StatusBadge isLate={s.is_late} hasFeedback={s.has_final_feedback} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                        {editingSubmission === s.id && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            title="Cập nhật phiên bản — chọn file mới (v1 → v2, ...)"
                            disabled={uploadingVersionForId === s.id}
                            onClick={() => handlePickNewVersion(s.id)}
                            style={{ whiteSpace: "nowrap" }}
                          >
                            <Icon name="Upload" size={14} /> Cập nhật phiên bản
                          </button>
                        )}
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/student/review/${s.id}`)}>
                          <Icon name="Eye" size={14} />
                        </button>
                        <button className="btn btn-sm btn-warning" onClick={() => {
                          setEditingSubmission(s.id);
                          setEditDocument(s.title || "");
                        }}>
                          <Icon name="Edit" size={14} />
                        </button>
                        {Number(s.version_number) > 1 && (
                          <button className="btn btn-sm btn-danger" onClick={() => setDeleteVersionId(s.version_id)}>
                            <Icon name="Trash" size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : null}
    </div>
  );
}
