import { useState, useEffect } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { teams, users } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";

export default function AdminTeams() {
  const { toast, showToast } = useToast();
  const [teamList, setTeamList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", semester: "", leader_user_id: "" });
  const [members, setMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    teams.list().then(setTeamList).catch(() => {});
    users.list({ role: "student" }).then(setStudentList).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) { showToast("Tên nhóm không được trống", "error"); return; }
    setCreating(true);
    try {
      const result = await teams.create(form);
      for (const uid of members) {
        await teams.addMember(result.id, uid, uid === Number(form.leader_user_id));
      }
      showToast("Tạo nhóm thành công!", "success");
      setShowCreate(false);
      setForm({ name: "", semester: "", leader_user_id: "" });
      setMembers([]);
      teams.list().then(setTeamList).catch(() => {});
    } catch (err) { showToast(err.message, "error"); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa nhóm này?")) return;
    try {
      await teams.remove(id);
      showToast("Đã xóa nhóm", "success");
      teams.list().then(setTeamList).catch(() => {});
    } catch (err) { showToast(err.message, "error"); }
  };

  const toggleMember = (uid) => {
    setMembers((prev) => prev.includes(uid) ? prev.filter((m) => m !== uid) : [...prev, uid]);
  };

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Quản lý nhóm</h1>
          <p>Tạo và quản lý các nhóm sinh viên</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}>
          <Icon name="Plus" size={16} /> Tạo nhóm mới
        </button>
      </div>

      {showCreate && (
        <div className="card">
          <div className="card-title">Tạo nhóm mới</div>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Tên nhóm *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="VD: CS-401 Nhóm 1" />
              </div>
              <div className="form-group">
                <label>Học kỳ</label>
                <input className="form-input" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))} placeholder="VD: 2024-1" />
              </div>
            </div>

            <div className="form-group">
              <label>Trưởng nhóm</label>
              <select className="form-input" value={form.leader_user_id} onChange={(e) => setForm((f) => ({ ...f, leader_user_id: e.target.value }))}>
                <option value="">-- Chọn trưởng nhóm --</option>
                {studentList.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Thành viên</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                {studentList.map((s) => (
                  <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: members.includes(s.id) ? "#eff6ff" : "#f8fafc", borderRadius: 6, cursor: "pointer", fontSize: "0.875rem", border: "1px solid #e2e8f0" }}>
                    <input type="checkbox" checked={members.includes(s.id)} onChange={() => toggleMember(s.id)} />
                    {s.full_name}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? "Đang tạo..." : "Tạo nhóm"}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>Tên nhóm</th><th>Học kỳ</th><th>Trưởng nhóm</th><th>Thành viên</th><th></th></tr>
          </thead>
          <tbody>
            {teamList.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.name}</strong></td>
                <td>{t.semester || "—"}</td>
                <td>{t.leader_name || "—"}</td>
                <td>{t.member_count}</td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>
                    <Icon name="Delete" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {teamList.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>Chưa có nhóm nào</p>}
      </div>
    </div>
  );
}
