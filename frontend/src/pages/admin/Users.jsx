import { useRef, useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import Icon from "../../components/UI/Icon.jsx";
import ConfirmModal from "../../components/UI/ConfirmModal.jsx";
import { users } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";

const PAGE_SIZE = 12;

/** Trả về mảng số trang và "ellipsis" để hiển thị < 1 2 … 5 > */
function buildPageList(totalPages, current) {
  if (totalPages < 1) return [];
  if (totalPages === 1) return [1];
  const set = new Set([1, totalPages, current]);
  for (let d = -2; d <= 2; d += 1) {
    const p = current + d;
    if (p >= 1 && p <= totalPages) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("ellipsis");
    out.push(sorted[i]);
  }
  return out;
}

export default function AdminUsers() {
  const { toast, showToast } = useToast();
  const [importReport, setImportReport] = useState(null);
  const [importReportPageBySection, setImportReportPageBySection] = useState({});
  const [userList, setUserList] = useState([]);
  const [page, setPage] = useState(1);
  const [confirmRole, setConfirmRole] = useState(null);
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

  /** Không hiển thị tài khoản admin trong danh sách quản trị */
  const visibleUsers = useMemo(
    () => (userList || []).filter((u) => u.role_name !== "admin"),
    [userList],
  );

  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedUsers = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return visibleUsers.slice(start, start + PAGE_SIZE);
  }, [visibleUsers, safePage]);

  const userPageItems = useMemo(() => buildPageList(totalPages, safePage), [totalPages, safePage]);

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
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Tạo tài khoản thất bại";
      showToast(msg, "error");
    }
    finally { setCreating(false); }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      await users.toggleStatus(userId, !currentActive);
      showToast(currentActive ? "Đã khóa tài khoản" : "Đã kích hoạt tài khoản", "success");
      load();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Cập nhật thất bại";
      showToast(msg, "error");
    }
  };

  const requestChangeRole = (userId, currentRole) => {
    const newRole = currentRole === "student" ? "supervisor" : "student";
    setConfirmRole({ userId, newRole, label: newRole === "student" ? "Sinh viên" : "Giảng viên" });
  };

  const applyChangeRole = async () => {
    if (!confirmRole) return;
    try {
      await users.changeRole(confirmRole.userId, confirmRole.newRole);
      showToast("Đổi vai trò thành công!", "success");
      setConfirmRole(null);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Đổi vai trò thất bại";
      showToast(msg, "error");
    }
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
      setImportReport({
        total: Number(result?.total || rows.length || 0),
        created: Number(result?.created || 0),
        failed: Number(result?.failed || failedRows.length || 0),
        results: Array.isArray(result?.results) ? result.results : [],
      });
      setImportReportPageBySection({});
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

      {importReport && (
        <div className="modal-overlay" role="presentation" onClick={() => setImportReport(null)}>
          <div
            className="modal import-report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-report-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="import-report-close"
              aria-label="Đóng"
              onClick={() => {
                setImportReport(null);
                setImportReportPageBySection({});
              }}
            >
              <Icon name="Close" size={16} />
            </button>
            <h3 id="import-report-title" style={{ marginBottom: 10 }}>Kết quả import tài khoản</h3>
            <p style={{ color: "#475569", fontSize: "0.9rem", marginBottom: 14 }}>
              Tổng: <strong>{importReport.total}</strong> · Thành công: <strong style={{ color: "#166534" }}>{importReport.created}</strong> · Thất bại: <strong style={{ color: "#991b1b" }}>{importReport.failed}</strong>
            </p>

            {(() => {
              const groups = {
                existed: [],
                missing: [],
                invalid: [],
                duplicate: [],
                other: [],
              };
              for (const row of importReport.results || []) {
                if (row?.status === "created") continue;
                const msg = String(row?.message || "").toLowerCase();
                if (msg.includes("đã tồn tại") || msg.includes("da ton tai")) {
                  groups.existed.push(row);
                } else if (msg.includes("thiếu") || msg.includes("thieu")) {
                  groups.missing.push(row);
                } else if (msg.includes("trùng") || msg.includes("trung")) {
                  groups.duplicate.push(row);
                } else if (
                  msg.includes("không hợp lệ")
                  || msg.includes("khong hop le")
                  || msg.includes("không đúng")
                  || msg.includes("khong dung")
                  || msg.includes("11 chữ số")
                  || msg.includes("11 chu so")
                  || msg.includes("định dạng")
                  || msg.includes("dinh dang")
                ) {
                  groups.invalid.push(row);
                } else {
                  groups.other.push(row);
                }
              }

              const sections = [
                { key: "existed", title: "Đã tồn tại", cls: "import-report-list--warning", items: groups.existed },
                { key: "missing", title: "Thiếu dữ liệu", cls: "import-report-list--danger", items: groups.missing },
                { key: "invalid", title: "Sai định dạng", cls: "import-report-list--danger", items: groups.invalid },
                { key: "duplicate", title: "Trùng thông tin", cls: "import-report-list--warning", items: groups.duplicate },
                { key: "other", title: "Lỗi khác", cls: "import-report-list--danger", items: groups.other },
              ].filter((s) => s.items.length > 0);

              if (sections.length === 0) {
                if ((importReport.created || 0) > 0 && (importReport.failed || 0) === 0) {
                  return <p style={{ color: "#166534", margin: "8px 0 0" }}>Tất cả tài khoản đã được import thành công.</p>;
                }
                return <p style={{ color: "#64748b", margin: "8px 0 0" }}>Không có chi tiết để hiển thị.</p>;
              }

              return (
                <div className="import-report-sections">
                  {sections.map((section) => (
                    (() => {
                      const PAGE_SIZE = 10;
                      const totalPages = Math.max(1, Math.ceil(section.items.length / PAGE_SIZE));
                      const currentPage = Math.min(
                        Math.max(importReportPageBySection[section.key] || 1, 1),
                        totalPages,
                      );
                      const start = (currentPage - 1) * PAGE_SIZE;
                      const pageItems = section.items.slice(start, start + PAGE_SIZE);
                      return (
                        <div key={section.key} className="import-report-section">
                          <div className="import-report-section__title">
                            {section.title}
                            <span className="badge badge-gray" style={{ marginLeft: 8 }}>{section.items.length}</span>
                          </div>
                          <ul className={`import-report-list ${section.cls}`}>
                            {pageItems.map((row) => (
                              <li key={`${section.key}-${row.line}-${row.email || "empty"}`}>
                                <strong>Dòng {row.line}</strong>
                                {" · "}
                                <span>ID: {row.mssv || "(không có ID)"}</span>
                                {" · "}
                                <span>{row.email || "(không có email)"}</span>
                                {row.message ? ` · ${row.message}` : ""}
                              </li>
                            ))}
                          </ul>
                          {totalPages > 1 && (
                            <div className="import-report-pager">
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                disabled={currentPage <= 1}
                                onClick={() => setImportReportPageBySection((prev) => ({ ...prev, [section.key]: currentPage - 1 }))}
                              >
                                &lt;
                              </button>
                              <span>Trang {currentPage}/{totalPages}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                disabled={currentPage >= totalPages}
                                onClick={() => setImportReportPageBySection((prev) => ({ ...prev, [section.key]: currentPage + 1 }))}
                              >
                                &gt;
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ))}
                </div>
              );
            })()}

          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmRole}
        title="Đổi vai trò người dùng"
        message={confirmRole ? `Xác nhận đổi vai trò sang: ${confirmRole.label}?` : ""}
        confirmLabel="Đổi vai trò"
        cancelLabel="Hủy"
        onCancel={() => setConfirmRole(null)}
        onConfirm={applyChangeRole}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        style={{ display: "none" }}
        onChange={handleImportCsv}
      />

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>Quản lý người dùng</h1>
          <p>Tạo tài khoản, quản lý vai trò và trạng thái</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}>
            <Icon name="Plus" size={16} /> Tạo tài khoản
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={importingCsv}
            onClick={() => fileInputRef.current?.click()}
            title="CSV/XLSX — cột: MSSV, Họ và tên, Gmail/Email, Vai trò, Mật khẩu"
          >
            <Icon name="Upload" size={16} /> {importingCsv ? "Đang import..." : "Import tài khoản"}
          </button>
        </div>
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
                <input type="password" className="form-input" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
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
            value={filter.search} onChange={(e) => { setPage(1); setFilter((f) => ({ ...f, search: e.target.value })); }} />
          <select className="form-input" style={{ maxWidth: 160 }} value={filter.role} onChange={(e) => { setPage(1); setFilter((f) => ({ ...f, role: e.target.value })); }}>
            <option value="">Tất cả vai trò</option>
            <option value="student">Sinh viên</option>
            <option value="supervisor">Giảng viên</option>
          </select>
          <select className="form-input" style={{ maxWidth: 160 }} value={filter.status} onChange={(e) => { setPage(1); setFilter((f) => ({ ...f, status: e.target.value })); }}>
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
            {pagedUsers.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.full_name}</strong></td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role_name === "supervisor" ? "badge-info" : "badge-gray"}`}>
                    {u.role_name === "supervisor" ? "Giảng viên" : "Sinh viên"}
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
                      <button className="btn btn-sm btn-secondary" onClick={() => requestChangeRole(u.id, u.role_name)} title="Đổi vai trò">
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
        {visibleUsers.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>Không có người dùng</p>}
        {visibleUsers.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
            <small style={{ color: "#64748b" }}>
              Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, visibleUsers.length)} / {visibleUsers.length} người
              {" · "}
              <strong>Trang {safePage} / {totalPages}</strong>
            </small>
            <div className="admin-page-pager" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-sm btn-secondary" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Trang trước">
                &lt;
              </button>
              {userPageItems.map((item, idx) =>
                item === "ellipsis" ? (
                  <span key={`e-${idx}`} style={{ padding: "0 4px", color: "#94a3b8", userSelect: "none" }}>…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`btn btn-sm ${item === safePage ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </button>
                ),
              )}
              <button type="button" className="btn btn-sm btn-secondary" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Trang sau">
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
