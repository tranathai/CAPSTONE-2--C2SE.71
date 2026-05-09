import { useState, useEffect } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { users } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";

export default function AdminUsers() {
  const { toast, showToast } = useToast();
  const [userList, setUserList] = useState([]);
  const [filter, setFilter] = useState({ role: "", status: "", search: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "student", phone: "" });
  const [creating, setCreating] = useState(false);

  const load = () => {
    users.list({ role: filter.role || undefined, status: filter.status || undefined, search: filter.search || undefined })
      .then(setUserList).catch(() => {});
  };

  useEffect(() => { load(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.email || !form.full_name) { showToast("Điền đầy đủ thông tin", "error"); return; }
    setCreating(true);
    try {
      await users.create(form);
      showToast("Tạo tài khoản thành công!", "success");
      setShowCreate(false);
      setForm({ email: "", password: "", full_name: "", role: "student", phone: "" });
      load();
    } catch (err) { showToast(err.message, "error"); }
    finally { setCreating(false); }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      await users.toggleStatus(userId, !currentActive);
      showToast(currentActive ? "Đã khóa tài khoản" : "Đã kích hoạt tài khoản", "success");
      load();
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleChangeRole = async (userId, currentRole) => {
    const newRole = currentRole === "student" ? "supervisor" : "student";
    if (!confirm(`Đổi vai trò thành ${newRole}?`)) return;
    try {
      await users.changeRole(userId, newRole);
      showToast("Đổi vai trò thành công!", "success");
      load();
    } catch (err) { showToast(err.message, "error"); }
  };

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Quản lý người dùng</h1>
          <p>Tạo tài khoản, quản lý vai trò và trạng thái</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}>
          <Icon name="Plus" size={16} /> Tạo tài khoản
        </button>
      </div>

      {showCreate && (
        <div className="card">
          <div className="card-title">Tạo tài khoản mới</div>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Họ tên *</label>
                <input className="form-input" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" className="form-input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Mật khẩu</label>
                <input type="password" className="form-input" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Để trống = không đặt mật khẩu" />
              </div>
              <div className="form-group">
                <label>Vai trò *</label>
                <select className="form-input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="student">Sinh viên</option>
                  <option value="supervisor">Giảng viên</option>
                </select>
              </div>
              <div className="form-group">
                <label>Điện thoại</label>
                <input className="form-input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? "Đang tạo..." : "Tạo tài khoản"}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input className="form-input" placeholder="Tìm theo tên, email..." style={{ maxWidth: 280 }}
            value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} />
          <select className="form-input" style={{ maxWidth: 160 }} value={filter.role} onChange={(e) => setFilter((f) => ({ ...f, role: e.target.value }))}>
            <option value="">Tất cả vai trò</option>
            <option value="student">Sinh viên</option>
            <option value="supervisor">Giảng viên</option>
            <option value="admin">Admin</option>
          </select>
          <select className="form-input" style={{ maxWidth: 160 }} value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Điện thoại</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.full_name}</strong></td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role_name === "admin" ? "badge-danger" : u.role_name === "supervisor" ? "badge-info" : "badge-gray"}`}>
                    {u.role_name === "admin" ? "Admin" : u.role_name === "supervisor" ? "Giảng viên" : "Sinh viên"}
                  </span>
                </td>
                <td>{u.phone || "—"}</td>
                <td>
                  <span className={`badge ${u.is_active ? "badge-success" : "badge-danger"}`}>
                    {u.is_active ? "Hoạt động" : "Đã khóa"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    {u.role_name !== "admin" && (
                      <button className="btn btn-sm btn-secondary" onClick={() => handleChangeRole(u.id, u.role_name)} title="Đổi vai trò">
                        <Icon name="ManageAccounts" size={13} />
                      </button>
                    )}
                    <button className={`btn btn-sm ${u.is_active ? "btn-danger" : "btn-success"}`}
                      onClick={() => handleToggleActive(u.id, u.is_active)}>
                      {u.is_active ? <Icon name="Lock" size={13} /> : <Icon name="Unlock" size={13} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {userList.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>Không có người dùng</p>}
      </div>
    </div>
  );
}
