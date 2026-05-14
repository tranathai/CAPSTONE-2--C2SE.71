import { useMemo, useState, useEffect } from "react";
import Icon from "../../components/UI/Icon.jsx";
import ConfirmModal from "../../components/UI/ConfirmModal.jsx";
import { teams, users } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";

const PAGE_SIZE = 10;

const TEAM_NAME_PREFIXES = [
  { value: "C1SE - ", label: "C1SE -" },
  { value: "C2SE - ", label: "C2SE -" },
];

const SEMESTER_OPTIONS = [
  { value: "I", label: "Học kỳ I" },
  { value: "II", label: "Học kỳ II" },
];

function defaultAcademicYearValue() {
  const n = new Date();
  const y = n.getMonth() >= 7 ? n.getFullYear() : n.getFullYear() - 1;
  return `${y}-${y + 1}`;
}

function academicYearSelectOptions() {
  const out = [];
  for (let start = 2018; start <= 2032; start++) {
    out.push({ value: `${start}-${start + 1}`, label: `Năm học ${start}-${start + 1}` });
  }
  return out;
}

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

export default function AdminTeams() {
  const { toast, showToast } = useToast();
  const [teamList, setTeamList] = useState([]);
  const [teamListPage, setTeamListPage] = useState(1);
  const [deleteTeamId, setDeleteTeamId] = useState(null);
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null);
  const [userList, setUserList] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    namePrefix: "C2SE - ",
    nameSuffix: "",
    semesterHalf: "I",
    academicYear: defaultAcademicYearValue(),
    leader_user_id: "",
    supervisor_user_id: "",
  });
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedTeamDetail, setSelectedTeamDetail] = useState(null);
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [memberSearchValue, setMemberSearchValue] = useState("");
  const [supervisorSearchValue, setSupervisorSearchValue] = useState("");

  useEffect(() => {
    teams.list().then(setTeamList).catch(() => {});
    users.list().then(setUserList).catch(() => {});
  }, []);

  const teamTotalPages = Math.max(1, Math.ceil(teamList.length / PAGE_SIZE));
  const teamSafePage = Math.min(teamListPage, teamTotalPages);
  const pagedTeamList = useMemo(() => {
    const start = (teamSafePage - 1) * PAGE_SIZE;
    return teamList.slice(start, start + PAGE_SIZE);
  }, [teamList, teamSafePage]);

  const teamPageItems = useMemo(() => buildPageList(teamTotalPages, teamSafePage), [teamTotalPages, teamSafePage]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const suffix = form.nameSuffix.trim();
    if (!suffix) {
      showToast("Vui lòng nhập phần số / mã nhóm sau prefix (VD: 40, 70)", "error");
      return;
    }
    const name = `${(form.namePrefix || "").trimEnd()}${suffix}`.replace(/\s+/g, " ").trim();
    if (!name) {
      showToast("Tên nhóm không được trống", "error");
      return;
    }
    const semester = `${form.academicYear} — Học kỳ ${form.semesterHalf === "II" ? "II" : "I"}`;
    if (teamList.some((t) => String(t.name || "").trim().toLowerCase() === name.toLowerCase())) {
      showToast("Tên nhóm đã tồn tại. Vui lòng chọn tên khác.", "error");
      return;
    }
    const selectedStudentIds = new Set(members);
    if (form.leader_user_id) {
      const leader = userList.find((u) => String(u.id) === String(form.leader_user_id));
      if (leader?.role_name === "student") selectedStudentIds.add(Number(form.leader_user_id));
    }
    if (selectedStudentIds.size > 5) {
      showToast("Nhóm chỉ được tối đa 5 sinh viên (không tính giảng viên)", "error");
      return;
    }
    setCreating(true);
    try {
      const result = await teams.create({
        name,
        semester,
        leader_user_id: form.leader_user_id || undefined,
        supervisor_user_id: form.supervisor_user_id || undefined,
      });
      for (const uid of members) {
        await teams.addMember(result.id, uid, uid === Number(form.leader_user_id));
      }
      showToast("Tạo nhóm thành công!", "success");
      setShowCreate(false);
      setForm({
        namePrefix: "C2SE - ",
        nameSuffix: "",
        semesterHalf: "I",
        academicYear: defaultAcademicYearValue(),
        leader_user_id: "",
        supervisor_user_id: "",
      });
      setMembers([]);
      teams.list().then(setTeamList).catch(() => {});
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Tạo nhóm thất bại";
      showToast(msg, "error");
    }
    finally { setCreating(false); }
  };

  const requestDeleteTeam = (id) => {
    setDeleteTeamId(id);
  };

  const executeDeleteTeam = async () => {
    if (deleteTeamId == null) return;
    const id = deleteTeamId;
    try {
      await teams.remove(id);
      showToast("Đã xóa nhóm", "success");
      setDeleteTeamId(null);
      teams.list().then(setTeamList).catch(() => {});
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Xóa nhóm thất bại";
      showToast(msg, "error");
    }
  };

  const openTeamDetail = async (teamId) => {
    setDetailLoading(true);
    try {
      const detail = await teams.get(teamId);
      setSelectedTeamDetail(detail);
    } catch (err) {
      showToast(err.message || "Không tải được chi tiết nhóm", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const reloadTeamDetail = async (teamId) => {
    const detail = await teams.get(teamId);
    setSelectedTeamDetail(detail);
  };

  const requestRemoveMember = (userId) => {
    if (!selectedTeamDetail?.id) return;
    const target = (selectedTeamDetail.members || []).find((m) => m.id === userId);
    if (target?.is_leader) {
      showToast("Không thể xóa trưởng nhóm. Hãy đổi trưởng nhóm trước.", "error");
      return;
    }
    setRemoveMemberTarget({ userId });
  };

  const executeRemoveMember = async () => {
    if (!selectedTeamDetail?.id || !removeMemberTarget) return;
    setMemberActionLoading(true);
    try {
      await teams.removeMember(selectedTeamDetail.id, removeMemberTarget.userId);
      await reloadTeamDetail(selectedTeamDetail.id);
      teams.list().then(setTeamList).catch(() => {});
      showToast("Đã xóa thành viên khỏi nhóm", "success");
      setRemoveMemberTarget(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Xóa thành viên thất bại";
      showToast(msg, "error");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleAddMemberFromDetail = async () => {
    if (!selectedTeamDetail?.id || !memberSearchValue.trim()) return;
    const searchText = memberSearchValue.trim().toLowerCase();
    const user = availableStudentsForDetail.find(
      (u) => String(u.email || "").toLowerCase() === searchText,
    );
    if (!user) {
      showToast("Hãy chọn đúng Gmail sinh viên từ danh sách gợi ý", "error");
      return;
    }
    setMemberActionLoading(true);
    try {
      await teams.addMember(selectedTeamDetail.id, Number(user.id), false);
      await reloadTeamDetail(selectedTeamDetail.id);
      teams.list().then(setTeamList).catch(() => {});
      setMemberSearchValue("");
      showToast("Đã thêm thành viên vào nhóm", "success");
    } catch (err) {
      showToast(err.message || "Thêm thành viên thất bại", "error");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleChangeSupervisorFromDetail = async () => {
    if (!selectedTeamDetail?.id || !supervisorSearchValue.trim()) return;
    const email = supervisorSearchValue.trim().toLowerCase();
    const supervisor = userList.find(
      (u) => u.role_name === "supervisor" && String(u.email || "").toLowerCase() === email,
    );
    if (!supervisor) {
      showToast("Hãy chọn đúng Gmail giảng viên từ danh sách gợi ý", "error");
      return;
    }
    setMemberActionLoading(true);
    try {
      await teams.update(selectedTeamDetail.id, { supervisor_user_id: supervisor.id });
      await reloadTeamDetail(selectedTeamDetail.id);
      teams.list().then(setTeamList).catch(() => {});
      setSupervisorSearchValue("");
      showToast("Đổi giảng viên hướng dẫn thành công", "success");
    } catch (err) {
      showToast(err.message || "Đổi giảng viên thất bại", "error");
    } finally {
      setMemberActionLoading(false);
    }
  };

  const toggleMember = (uid) => {
    const user = userList.find((u) => u.id === uid);
    if (!user || user.role_name !== "student") return;
    setMembers((prev) => prev.includes(uid) ? prev.filter((m) => m !== uid) : [...prev, uid]);
  };

  const filteredUsers = useMemo(() => {
    const keyword = memberSearch.trim().toLowerCase();
    return userList.filter((u) => {
      if (u.role_name === "admin") return false;
      if (memberRoleFilter && u.role_name !== memberRoleFilter) return false;
      if (!keyword) return true;
      return (
        String(u.full_name || "").toLowerCase().includes(keyword)
        || String(u.email || "").toLowerCase().includes(keyword)
      );
    });
  }, [userList, memberSearch, memberRoleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(memberPage, totalPages);
  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const supervisorEmail = useMemo(() => {
    if (!selectedTeamDetail?.supervisor_user_id) return "";
    const matched = userList.find((u) => String(u.id) === String(selectedTeamDetail.supervisor_user_id));
    return matched?.email || "";
  }, [selectedTeamDetail, userList]);

  const availableStudentsForDetail = useMemo(() => {
    const currentIds = new Set((selectedTeamDetail?.members || []).map((m) => Number(m.id)));
    return userList.filter((u) => u.role_name === "student" && !currentIds.has(Number(u.id)));
  }, [selectedTeamDetail, userList]);
  const studentSearchSuggestions = useMemo(() => {
    const keyword = memberSearchValue.trim().toLowerCase();
    if (!keyword) return availableStudentsForDetail.slice(0, 8);
    return availableStudentsForDetail
      .filter((u) => (
        String(u.email || "").toLowerCase().includes(keyword)
        || String(u.full_name || "").toLowerCase().includes(keyword)
      ))
      .slice(0, 8);
  }, [availableStudentsForDetail, memberSearchValue]);
  const supervisorSuggestions = useMemo(() => {
    const keyword = supervisorSearchValue.trim().toLowerCase();
    const supervisors = userList.filter((u) => u.role_name === "supervisor");
    if (!keyword) return supervisors.slice(0, 8);
    return supervisors
      .filter((u) => (
        String(u.email || "").toLowerCase().includes(keyword)
        || String(u.full_name || "").toLowerCase().includes(keyword)
      ))
      .slice(0, 8);
  }, [supervisorSearchValue, userList]);

  const selectedTeamStudentCount = useMemo(
    () => (selectedTeamDetail?.members || []).length,
    [selectedTeamDetail],
  );
  const isTeamAtMaxStudents = selectedTeamStudentCount >= 5;

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
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "end" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Tiền tố *</label>
                <select
                  className="form-input"
                  value={form.namePrefix}
                  onChange={(e) => setForm((f) => ({ ...f, namePrefix: e.target.value }))}
                >
                  {TEAM_NAME_PREFIXES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Số / mã nhóm *</label>
                <input
                  className="form-input"
                  value={form.nameSuffix}
                  onChange={(e) => setForm((f) => ({ ...f, nameSuffix: e.target.value }))}
                  placeholder="VD: 40, 70"
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Học kỳ</label>
                <select
                  className="form-input"
                  value={form.semesterHalf}
                  onChange={(e) => setForm((f) => ({ ...f, semesterHalf: e.target.value }))}
                >
                  {SEMESTER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Năm học</label>
                <select
                  className="form-input"
                  value={form.academicYear}
                  onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
                >
                  {academicYearSelectOptions().map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Tìm thành viên/Giảng viên</label>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                <input
                  className="form-input"
                  placeholder="Tìm theo họ tên hoặc email..."
                  value={memberSearch}
                  onChange={(e) => { setMemberPage(1); setMemberSearch(e.target.value); }}
                />
                <select
                  className="form-input"
                  value={memberRoleFilter}
                  onChange={(e) => { setMemberPage(1); setMemberRoleFilter(e.target.value); }}
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="student">Sinh viên</option>
                  <option value="supervisor">Giảng viên</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Danh sách chọn thành viên/giảng viên (10 mỗi trang)</label>
              <p style={{ marginTop: 4, marginBottom: 8, color: "#64748b", fontSize: "0.875rem" }}>
                Sinh viên: chọn Thành viên/Trưởng nhóm (tối đa 5 sinh viên). Giảng viên: chọn ô Giảng viên hướng dẫn.
              </p>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Thành viên</th>
                      <th>Trưởng nhóm</th>
                      <th>Giảng viên hướng dẫn</th>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Vai trò</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <input
                            type="checkbox"
                            disabled={u.role_name !== "student"}
                            checked={members.includes(u.id)}
                            onChange={() => toggleMember(u.id)}
                          />
                        </td>
                        <td>
                          <input
                            type="radio"
                            name="leader_user_id"
                            disabled={u.role_name !== "student"}
                            checked={String(form.leader_user_id) === String(u.id)}
                            onChange={() => setForm((f) => ({ ...f, leader_user_id: String(u.id) }))}
                          />
                        </td>
                        <td>
                          <input
                            type="radio"
                            name="supervisor_user_id"
                            disabled={u.role_name !== "supervisor"}
                            checked={String(form.supervisor_user_id) === String(u.id)}
                            onChange={() => setForm((f) => ({ ...f, supervisor_user_id: String(u.id) }))}
                          />
                        </td>
                        <td>{u.full_name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role_name === "supervisor" ? "badge-info" : "badge-gray"}`}>
                            {u.role_name === "supervisor" ? "Giảng viên" : "Sinh viên"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {pagedUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>Không có dữ liệu</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <small style={{ color: "#64748b" }}>
                  Tổng {filteredUsers.length} người | Trang {currentPage}/{totalPages}
                </small>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" className="btn btn-sm btn-secondary" disabled={currentPage <= 1} onClick={() => setMemberPage((p) => Math.max(1, p - 1))}>
                    Trước
                  </button>
                  <button type="button" className="btn btn-sm btn-secondary" disabled={currentPage >= totalPages} onClick={() => setMemberPage((p) => Math.min(totalPages, p + 1))}>
                    Sau
                  </button>
                </div>
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
            <tr><th>Tên nhóm</th><th>Học kỳ</th><th>Trưởng nhóm</th><th>Giảng viên</th><th>Thành viên</th><th></th></tr>
          </thead>
          <tbody>
            {pagedTeamList.map((t) => (
              <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => openTeamDetail(t.id)}>
                <td><strong>{t.name}</strong></td>
                <td>{t.semester || "—"}</td>
                <td>{t.leader_name || "—"}</td>
                <td>{t.supervisor_name || "—"}</td>
                <td>{t.member_count}</td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); requestDeleteTeam(t.id); }}>
                    <Icon name="Delete" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {teamList.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>Chưa có nhóm nào</p>}
        {teamList.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
            <small style={{ color: "#64748b" }}>
              Hiển thị {(teamSafePage - 1) * PAGE_SIZE + 1}–{Math.min(teamSafePage * PAGE_SIZE, teamList.length)} / {teamList.length} nhóm
              {" · "}
              <strong>Trang {teamSafePage} / {teamTotalPages}</strong>
            </small>
            <div className="admin-page-pager" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-sm btn-secondary" disabled={teamSafePage <= 1} onClick={() => setTeamListPage((p) => Math.max(1, p - 1))} aria-label="Trang trước">
                &lt;
              </button>
              {teamPageItems.map((item, idx) =>
                item === "ellipsis" ? (
                  <span key={`te-${idx}`} style={{ padding: "0 4px", color: "#94a3b8", userSelect: "none" }}>…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`btn btn-sm ${item === teamSafePage ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setTeamListPage(item)}
                  >
                    {item}
                  </button>
                ),
              )}
              <button type="button" className="btn btn-sm btn-secondary" disabled={teamSafePage >= teamTotalPages} onClick={() => setTeamListPage((p) => Math.min(teamTotalPages, p + 1))} aria-label="Trang sau">
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {(detailLoading || selectedTeamDetail) && (
        <div className="modal-overlay" onClick={() => !detailLoading && setSelectedTeamDetail(null)}>
          <div className="modal team-detail-modal" style={{ maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="team-detail-modal__close"
              aria-label="Đóng"
              disabled={detailLoading}
              onClick={() => setSelectedTeamDetail(null)}
            >
              <Icon name="Close" size={22} />
            </button>
            <h3 className="team-detail-modal__title">Chi tiết nhóm</h3>
            {detailLoading ? (
              <p style={{ color: "#64748b" }}>Đang tải dữ liệu...</p>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 4 }}>Tên nhóm</div>
                    <strong>{selectedTeamDetail?.name || "—"}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 4 }}>Dự án đang tham gia</div>
                    <strong>{selectedTeamDetail?.topic?.title || "—"}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 4 }}>Giảng viên hướng dẫn</div>
                    <strong>{selectedTeamDetail?.supervisor_name || selectedTeamDetail?.topic?.supervisor_name || "—"}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 4 }}>Email giảng viên</div>
                    <strong>{supervisorEmail || "—"}</strong>
                  </div>
                </div>
                <div className="card" style={{ marginBottom: 12 }}>
                  <div className="card-title">Đổi giảng viên hướng dẫn</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                    <input
                      className="form-input"
                      value={supervisorSearchValue}
                      onChange={(e) => setSupervisorSearchValue(e.target.value)}
                      disabled={memberActionLoading}
                      placeholder="Tìm giảng viên theo Gmail hoặc họ tên..."
                      list="supervisor-search-suggestions"
                    />
                    <datalist id="supervisor-search-suggestions">
                      {supervisorSuggestions.map((u) => (
                        <option key={u.id} value={u.email}>{u.full_name}</option>
                      ))}
                    </datalist>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={memberActionLoading || !supervisorSearchValue.trim()}
                      onClick={handleChangeSupervisorFromDetail}
                    >
                      <Icon name="Save" size={14} /> Đổi giảng viên
                    </button>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-title">Danh sách thành viên</div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Họ tên</th>
                        <th>MSSV</th>
                        <th>Gmail</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedTeamDetail?.members || []).map((m) => (
                        <tr key={m.id}>
                          <td>{m.full_name}</td>
                          <td>{m.student_code || "—"}</td>
                          <td>{m.email || "—"}</td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              disabled={memberActionLoading || !!m.is_leader}
                              onClick={() => requestRemoveMember(m.id)}
                              title={m.is_leader ? "Không thể xóa trưởng nhóm" : "Xóa thành viên"}
                            >
                              <Icon name="Delete" size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!selectedTeamDetail?.members || selectedTeamDetail.members.length === 0) && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", color: "#94a3b8" }}>Chưa có thành viên</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <p style={{ marginTop: 12, marginBottom: 8, color: isTeamAtMaxStudents ? "#b91c1c" : "#64748b", fontSize: "0.875rem" }}>
                    Nhóm tối đa 5 sinh viên. {isTeamAtMaxStudents ? "Đã đủ 5 thành viên, muốn thêm phải xóa 1 người trước." : `Hiện tại: ${selectedTeamStudentCount}/5.`}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                    <input
                      className="form-input"
                      value={memberSearchValue}
                      onChange={(e) => setMemberSearchValue(e.target.value)}
                      disabled={memberActionLoading || isTeamAtMaxStudents}
                      placeholder="Tìm sinh viên theo Gmail hoặc họ tên..."
                      list="student-search-suggestions"
                    />
                    <datalist id="student-search-suggestions">
                      {studentSearchSuggestions.map((u) => (
                        <option key={u.id} value={u.email}>{u.full_name}</option>
                      ))}
                    </datalist>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={memberActionLoading || !memberSearchValue.trim() || isTeamAtMaxStudents}
                      onClick={handleAddMemberFromDetail}
                    >
                      <Icon name="Plus" size={14} /> Thêm thành viên
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteTeamId != null}
        title="Xóa nhóm"
        message="Xóa nhóm này? Hành động không thể hoàn tác."
        confirmLabel="Xóa nhóm"
        cancelLabel="Hủy"
        danger
        onCancel={() => setDeleteTeamId(null)}
        onConfirm={executeDeleteTeam}
      />
      <ConfirmModal
        open={!!removeMemberTarget}
        title="Xóa thành viên"
        message="Xóa thành viên này khỏi nhóm?"
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        danger
        busy={memberActionLoading}
        onCancel={() => !memberActionLoading && setRemoveMemberTarget(null)}
        onConfirm={executeRemoveMember}
      />
    </div>
  );
}
