import { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Icon from "../../components/UI/Icon.jsx";
import { users } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";

export default function AdminUsers() {
  const { toast, showToast } = useToast();
  const [userList, setUserList] = useState([]);
  const [filter, setFilter] = useState({ role: "", status: "", search: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "student", phone: "", user_code: "" });
  const [creating, setCreating] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const fileInputRef = useRef(null);

  const load = () => {
    users.list({ role: filter.role || undefined, status: filter.status || undefined, search: filter.search || undefined })
      .then(setUserList).catch(() => {});
  };

  useEffect(() => { load(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.email || !form.full_name) { showToast("Điền đầy đủ thông tin", "error"); return; }
    if (!/^0\d{8}$/.test(String(form.phone || "").trim())) {
      showToast("Số điện thoại phải có 9 chữ số và bắt đầu bằng 0", "error");
      return;
    }
    if (!/^\d{11}$/.test(String(form.user_code || "").trim())) {
      showToast("ID phải gồm đúng 11 chữ số", "error");
      return;
    }
    setCreating(true);
    try {
      await users.create(form);
      showToast("Tạo tài khoản thành công!", "success");
      setShowCreate(false);
      setForm({ email: "", password: "", full_name: "", role: "student", phone: "", user_code: "" });
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

  const parseCsvLine = (line) => {
    const cells = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === "\"") {
        if (inQuotes && line[i + 1] === "\"") {
          current += "\"";
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const normalizeHeader = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const getColumnIndex = (headerMap, aliases) => {
    for (const alias of aliases) {
      if (headerMap.has(alias)) return headerMap.get(alias);
    }
    return undefined;
  };

  const mapRowsByHeader = (matrixRows) => {
    if (matrixRows.length < 2) throw new Error("File cần có dòng tiêu đề và ít nhất 1 dòng dữ liệu");
    const header = matrixRows[0].map((cell) => String(cell ?? "").trim());
    const headerMap = new Map(header.map((h, idx) => [normalizeHeader(h), idx]));

    const colMssv = getColumnIndex(headerMap, ["mssv", "ma so sinh vien", "ma sinh vien"]);
    const colName = getColumnIndex(headerMap, ["ho va ten", "ho ten", "ten"]);
    const colEmail = getColumnIndex(headerMap, ["gmail", "email"]);
    const colRole = getColumnIndex(headerMap, ["vai tro", "role"]);
    const colPassword = getColumnIndex(headerMap, ["mat khau", "password"]);

    if ([colMssv, colName, colEmail, colRole, colPassword].some((v) => v === undefined)) {
      throw new Error("File thiếu cột bắt buộc: MSSV, Họ và tên, Gmail/Email, Vai trò, Mật khẩu");
    }

    return matrixRows
      .slice(1)
      .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
      .map((row) => ({
        mssv: String(row[colMssv] ?? "").trim(),
        full_name: String(row[colName] ?? "").trim(),
        email: String(row[colEmail] ?? "").trim(),
        role: String(row[colRole] ?? "").trim(),
        password: String(row[colPassword] ?? "").trim(),
      }));
  };

  const readRowsFromCsv = (text) => {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
    const rows = lines.map((line) => parseCsvLine(line));
    return mapRowsByHeader(rows);
  };

  const readRowsFromXlsx = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) throw new Error("Không tìm thấy sheet dữ liệu");
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    return mapRowsByHeader(rows);
  };

  const handleImportCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportingCsv(true);
    try {
      const lowerName = file.name.toLowerCase();
      const rows = lowerName.endsWith(".xlsx")
        ? await readRowsFromXlsx(file)
        : await readRowsFromCsv(await file.text());
      const result = await users.importCsv(rows);
      const failedRows = (result?.results || []).filter((r) => r.status === "failed");
      if (failedRows.length > 0) {
        const preview = failedRows.slice(0, 3).map((r) => `Dòng ${r.line}: ${r.message}`).join(" | ");
        showToast(`${result.created}/${result.total} thành công. ${preview}`, "info");
      } else {
        showToast(`Import thành công ${result.created}/${result.total} tài khoản`, "success");
      }
      load();
    } catch (err) {
      showToast(err.message || "Import file thất bại", "error");
    } finally {
      event.target.value = "";
      setImportingCsv(false);
    }
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

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Import tài khoản từ CSV</div>
        <p style={{ marginTop: 0, color: "#64748b" }}>
          Hỗ trợ CSV/XLSX. Cột bắt buộc: MSSV, Họ và tên, Gmail/Email, Vai trò, Mật khẩu
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style={{ display: "none" }}
          onChange={handleImportCsv}
        />
        <button
          type="button"
          className="btn btn-secondary"
          disabled={importingCsv}
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon name="Upload" size={16} /> {importingCsv ? "Đang import..." : "Chọn file CSV/XLSX"}
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
                <input
                  className="form-input"
                  value={form.phone}
                  maxLength={9}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
                  placeholder="VD: 012345678"
                />
              </div>
              <div className="form-group">
                <label>ID (MSSV/MSGV)</label>
                <input
                  className="form-input"
                  value={form.user_code}
                  maxLength={11}
                  onChange={(e) => setForm((f) => ({ ...f, user_code: e.target.value.replace(/\D/g, "") }))}
                  placeholder="VD: 20260000001"
                />
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
