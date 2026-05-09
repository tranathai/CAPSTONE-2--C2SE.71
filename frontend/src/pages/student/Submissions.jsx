import { useState, useEffect } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { submissions, milestones, teams } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";
import { useNavigate } from "react-router-dom";

export default function StudentSubmissions() {
  const [team, setTeam] = useState(null);
  const [history, setHistory] = useState([]);
  const [milestoneList, setMilestoneList] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const { toast, showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      teams.myTeam(),
      submissions.my(),
      milestones.list(),
    ]).then(([t, subs, ms]) => {
      setTeam(t);
      setHistory(subs);
      setMilestoneList(ms);
    }).catch(() => {});
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { showToast("Vui lòng chọn file", "error"); return; }
    if (!selectedMilestone) { showToast("Vui lòng chọn mốc thời gian", "error"); return; }
    if (!team) { showToast("Bạn chưa thuộc nhóm nào", "error"); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("team_id", team.id);
    formData.append("milestone_id", selectedMilestone);
    if (title) formData.append("title", title);

    try {
      await submissions.studentUpload(formData);
      showToast("Upload thành công!", "success");
      setShowUpload(false);
      setFile(null);
      setTitle("");
      const subs = await submissions.my();
      setHistory(subs);
    } catch (err) {
      showToast(err.message || "Upload thất bại", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleEditTitle = async (submissionId) => {
    if (!editTitle.trim()) return;
    try {
      await submissions.update(submissionId, { title: editTitle.trim() });
      showToast("Cập nhật thành công!", "success");
      setEditingSubmission(null);
      setEditTitle("");
      const subs = await submissions.my();
      setHistory(subs);
    } catch (err) {
      showToast(err.message || "Cập nhật thất bại", "error");
    }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!confirm("Bạn có chắc muốn xóa phiên bản này?")) return;
    try {
      await submissions.deleteVersion(versionId);
      showToast("Xóa thành công!", "success");
      const subs = await submissions.my();
      setHistory(subs);
    } catch (err) {
      showToast(err.message || "Xóa thất bại", "error");
    }
  };

  const StatusBadge = ({ isLate, hasFeedback }) => {
    if (hasFeedback) return <span className="badge badge-success"><Icon name="CheckCircle" size={12} /> Đã phản hồi</span>;
    if (isLate) return <span className="badge badge-danger"><Icon name="AlertTriangle" size={12} /> Trễ</span>;
    return <span className="badge badge-warning"><Icon name="Clock" size={12} /> Chờ phản hồi</span>;
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

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Nộp bài</h1>
          <p>Upload báo cáo theo từng mốc thời gian</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload((v) => !v)}>
          <Icon name="Upload" size={16} /> Nộp bài mới
        </button>
      </div>

      {showUpload && (
        <div className="card">
          <div className="card-title">Upload bài nộp mới</div>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label>Tiêu đề (tùy chọn)</label>
              <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Báo cáo giữa kỳ" />
            </div>
            <div className="form-group">
              <label>Mốc thời gian *</label>
              <select className="form-input" value={selectedMilestone} onChange={(e) => setSelectedMilestone(e.target.value)}>
                <option value="">-- Chọn mốc thời gian --</option>
                {milestoneList.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>File (.pdf, .docx, .doc) - tối đa 10MB *</label>
              <input type="file" accept=".pdf,.docx,.doc" onChange={(e) => setFile(e.target.files[0])} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                {uploading ? "Đang upload..." : "Gửi bài"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {Object.keys(groupedByMilestone).length === 0 ? (
        <div className="card empty-state">
          <Icon name="FileText" size={48} sx={{ opacity: 0.3 }} />
          <h3>Chưa có bài nộp nào</h3>
          <p>Nhấn "Nộp bài mới" để bắt đầu</p>
        </div>
      ) : (
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
                  <th>Tiêu đề</th>
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
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input 
                            className="form-input" 
                            value={editTitle} 
                            onChange={(e) => setEditTitle(e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <button className="btn btn-sm btn-success" onClick={() => handleEditTitle(s.id)}>
                            <Icon name="Check" size={14} />
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => setEditingSubmission(null)}>
                            <Icon name="X" size={14} />
                          </button>
                        </div>
                      ) : (
                        <strong>{s.title}</strong>
                      )}
                    </td>
                    <td>{new Date(s.version_submitted_at || s.submitted_at).toLocaleDateString("vi-VN")}</td>
                    <td>v{s.version_number}</td>
                    <td><StatusBadge isLate={s.is_late} hasFeedback={s.has_final_feedback} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/student/review/${s.id}`)}>
                          <Icon name="Eye" size={14} />
                        </button>
                        <button className="btn btn-sm btn-warning" onClick={() => {
                          setEditingSubmission(s.id);
                          setEditTitle(s.title);
                        }}>
                          <Icon name="Edit" size={14} />
                        </button>
                        {s.version_number > 1 && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteVersion(s.version_id)}>
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
      )}
    </div>
  );
}
