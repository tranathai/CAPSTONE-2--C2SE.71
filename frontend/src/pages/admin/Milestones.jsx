import { useState, useEffect } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { milestones } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";

export default function AdminMilestones() {
  const { toast, showToast } = useToast();
  const [list, setList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", start_date: "", end_date: "", deadline_type: "soft", display_order: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { milestones.list().then(setList).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.start_date || !form.end_date) { showToast("Điền đầy đủ thông tin", "error"); return; }
    setSubmitting(true);
    try {
      if (editId) {
        await milestones.update(editId, form);
        showToast("Cập nhật thành công!", "success");
      } else {
        await milestones.create(form);
        showToast("Tạo milestone thành công!", "success");
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: "", description: "", start_date: "", end_date: "", deadline_type: "soft", display_order: 0 });
      milestones.list().then(setList).catch(() => {});
    } catch (err) { showToast(err.message, "error"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (m) => {
    setEditId(m.id);
    setForm({
      name: m.name,
      description: m.description || "",
      start_date: m.start_date?.slice(0, 16) || "",
      end_date: m.end_date?.slice(0, 16) || "",
      deadline_type: m.deadline_type || "soft",
      display_order: m.display_order || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa mốc thời gian này?")) return;
    try {
      await milestones.remove(id);
      showToast("Đã xóa", "success");
      milestones.list().then(setList).catch(() => {});
    } catch (err) { showToast(err.message, "error"); }
  };

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Mốc thời gian</h1>
          <p>Quản lý các mốc thời gian và deadline của đồ án</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm({ name: "", description: "", start_date: "", end_date: "", deadline_type: "soft", display_order: 0 }); setShowForm((v) => !v); }}>
          <Icon name="Plus" size={16} /> Thêm mốc mới
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-title">{editId ? "Chỉnh sửa" : "Tạo mốc mới"}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tên mốc *</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="VD: Proposal, Mid-term Report" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Ngày bắt đầu *</label>
                <input type="datetime-local" className="form-input" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Ngày kết thúc *</label>
                <input type="datetime-local" className="form-input" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Loại deadline</label>
                <select className="form-input" value={form.deadline_type} onChange={(e) => setForm((f) => ({ ...f, deadline_type: e.target.value }))}>
                  <option value="soft">Soft (Cảnh báo)</option>
                  <option value="hard">Hard (Cứng - không cho nộp)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Thứ tự hiển thị</label>
                <input type="number" className="form-input" value={form.display_order} onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Mô tả</label>
              <textarea className="form-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Đang lưu..." : "Lưu"}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>Tên</th><th>Bắt đầu</th><th>Kết thúc</th><th>Loại</th><th>Thứ tự</th><th></th></tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id}>
                <td><strong>{m.name}</strong></td>
                <td>{new Date(m.start_date).toLocaleDateString("vi-VN")}</td>
                <td>{new Date(m.end_date).toLocaleDateString("vi-VN")}</td>
                <td>
                  <span className={`badge ${m.deadline_type === "hard" ? "badge-danger" : "badge-warning"}`}>
                    {m.deadline_type === "hard" ? "Cứng" : "Mềm"}
                  </span>
                </td>
                <td>{m.display_order}</td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(m)}><Icon name="Edit" size={13} /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m.id)}><Icon name="Delete" size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
