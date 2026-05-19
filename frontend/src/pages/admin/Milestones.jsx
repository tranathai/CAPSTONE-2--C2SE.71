import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/UI/Icon.jsx";
import ConfirmModal from "../../components/UI/ConfirmModal.jsx";
import RequiredDocumentsPicker from "../../components/admin/RequiredDocumentsPicker.jsx";
import { milestones } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";

const BATCH_PAGE_SIZE = 10;

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

function formatDdMmYyyy(value) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function parseValidDateTime(v) {
  if (v == null || (typeof v === "string" && !v.trim())) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isBatchClosed(batch) {
  if (!batch?.end_date) return false;
  const end = new Date(batch.end_date);
  return !Number.isNaN(end.getTime()) && Date.now() > end.getTime();
}

function toDatetimeLocalSlice(iso) {
  if (!iso) return "";
  const s = String(iso);
  return s.length >= 16 ? s.slice(0, 16) : s;
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="form-field-error" role="alert">
      {message}
    </p>
  );
}

function inputClass(hasError) {
  return hasError ? "form-input form-input--invalid" : "form-input";
}

function clearFieldError(setErrors, field) {
  setErrors((prev) => {
    if (!prev[field]) return prev;
    const next = { ...prev };
    delete next[field];
    return next;
  });
}

function validateBatchForm(batchForm, batchRange, batches) {
  const errors = {};
  const name = batchForm.name.trim();
  if (!name) {
    errors.name = "Tên đợt tốt nghiệp không được để trống.";
  } else {
    const batchKey = name.toLowerCase();
    if (batches.some((b) => String(b.name || "").trim().toLowerCase() === batchKey)) {
      errors.name = "Tên đợt tốt nghiệp đã tồn tại. Vui lòng chọn tên khác.";
    }
  }
  const startRaw = batchRange.start?.trim() || "";
  const endRaw = batchRange.end?.trim() || "";
  if (!startRaw) errors.start = "Vui lòng chọn ngày bắt đầu.";
  if (!endRaw) errors.end = "Vui lòng chọn ngày kết thúc.";
  if (startRaw && endRaw) {
    const a = parseValidDateTime(startRaw);
    const b = parseValidDateTime(endRaw);
    if (!a) errors.start = errors.start || "Ngày bắt đầu không hợp lệ.";
    if (!b) errors.end = errors.end || "Ngày kết thúc không hợp lệ.";
    if (a && b && a.getTime() >= b.getTime()) {
      errors.end = "Ngày kết thúc phải sau ngày bắt đầu.";
    }
  }
  return errors;
}

function validateMilestoneForm(form, list, editId, selectedBatch) {
  const errors = {};
  if (!form.name?.trim()) {
    errors.name = "Tên mốc không được để trống.";
  }
  const startRaw = form.start_date?.trim() || "";
  const endRaw = form.end_date?.trim() || "";
  if (!startRaw) errors.start_date = "Vui lòng chọn ngày bắt đầu.";
  if (!endRaw) errors.end_date = "Vui lòng chọn ngày kết thúc.";
  const start = parseValidDateTime(startRaw);
  const end = parseValidDateTime(endRaw);
  if (startRaw && !start) errors.start_date = errors.start_date || "Ngày bắt đầu không hợp lệ.";
  if (endRaw && !end) errors.end_date = errors.end_date || "Ngày kết thúc không hợp lệ.";
  if (start && end && start.getTime() >= end.getTime()) {
    errors.end_date = "Thời gian kết thúc phải sau thời gian bắt đầu.";
  }
  if (start && end && selectedBatch) {
    const bs = parseValidDateTime(selectedBatch.start_date);
    const be = parseValidDateTime(selectedBatch.end_date);
    if (bs && be) {
      if (start.getTime() < bs.getTime()) {
        errors.start_date = "Thời gian mốc phải nằm trong khung thời gian của đợt tốt nghiệp.";
      }
      if (end.getTime() > be.getTime()) {
        errors.end_date = "Thời gian mốc phải nằm trong khung thời gian của đợt tốt nghiệp.";
      }
    } else if (bs && start.getTime() < bs.getTime()) {
      errors.start_date = "Ngày bắt đầu mốc không được trước ngày bắt đầu đợt.";
    } else if (be && end.getTime() > be.getTime()) {
      errors.end_date = "Ngày kết thúc mốc không được sau ngày kết thúc đợt.";
    }
    if (start && end) {
      const overlap = findOverlappingMilestone(start, end, list, editId);
      if (overlap) {
        errors.start_date = errors.start_date || `Mốc trùng khoảng thời gian với mốc "${overlap}".`;
      }
    }
  }
  const docs = Array.isArray(form.required_documents)
    ? form.required_documents.map((s) => String(s).trim()).filter(Boolean)
    : [];
  if (docs.length === 0) {
    errors.required_documents = "Vui lòng chọn ít nhất 1 tài liệu cần nộp.";
  }
  return errors;
}

/** Trả về tên mốc trùng hoặc null (cùng khoảng thời gian có giao, không tính chạm mép). */
function findOverlappingMilestone(start, end, milestoneList, excludeId) {
  for (const m of milestoneList) {
    if (excludeId != null && Number(m.id) === Number(excludeId)) continue;
    const b0 = parseValidDateTime(m.start_date);
    const b1 = parseValidDateTime(m.end_date);
    if (!b0 || !b1) continue;
    if (start < b1 && end > b0) return m.name;
  }
  return null;
}

export default function AdminMilestones() {
  const { toast, showToast } = useToast();
  const navigate = useNavigate();
  const { batchId: batchIdParam } = useParams();
  const selectedBatchId = batchIdParam ? Number(batchIdParam) : null;
  const [batches, setBatches] = useState([]);
  const [list, setList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [batchForm, setBatchForm] = useState({ name: "", description: "" });
  /** Giống Tạo mốc mới: datetime-local (YYYY-MM-DDTHH:mm) */
  const [batchRange, setBatchRange] = useState({ start: "", end: "" });
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchErrors, setBatchErrors] = useState({});
  const [milestoneErrors, setMilestoneErrors] = useState({});
  const [batchPage, setBatchPage] = useState(1);
  const [form, setForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    deadline_type: "soft",
    display_order: 0,
    required_documents: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteBatchId, setDeleteBatchId] = useState(null);
  const [deleteMilestoneId, setDeleteMilestoneId] = useState(null);

  const loadBatches = async () => {
    const rows = await milestones.batchList();
    setBatches(rows);
  };

  const loadMilestones = async (batchId = selectedBatchId) => {
    if (!batchId) {
      setList([]);
      return;
    }
    const rows = await milestones.list({ batch_id: batchId });
    setList(rows);
  };

  useEffect(() => {
    loadBatches().catch(() => {});
  }, []);

  useEffect(() => {
    loadMilestones(selectedBatchId).catch(() => {});
  }, [selectedBatchId]);

  const selectedBatch = useMemo(
    () => batches.find((b) => Number(b.id) === Number(selectedBatchId)) || null,
    [batches, selectedBatchId],
  );
  const batchTotalPages = Math.max(1, Math.ceil(batches.length / BATCH_PAGE_SIZE));
  const safeBatchPage = Math.min(batchPage, batchTotalPages);
  const pagedBatches = useMemo(() => {
    const start = (safeBatchPage - 1) * BATCH_PAGE_SIZE;
    return batches.slice(start, start + BATCH_PAGE_SIZE);
  }, [batches, safeBatchPage]);
  const batchPageItems = useMemo(
    () => buildPageList(batchTotalPages, safeBatchPage),
    [batchTotalPages, safeBatchPage],
  );

  useEffect(() => {
    if (batchPage > batchTotalPages) setBatchPage(batchTotalPages);
  }, [batchPage, batchTotalPages]);

  useEffect(() => {
    if (selectedBatchId && batches.length > 0 && !selectedBatch) {
      showToast("Đợt tốt nghiệp không tồn tại hoặc đã bị xóa", "error");
      navigate("/admin/milestones", { replace: true });
    }
  }, [selectedBatchId, selectedBatch, batches, navigate, showToast]);

  const resetMilestoneForm = () => {
    setShowForm(false);
    setEditId(null);
    setMilestoneErrors({});
    setForm({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      deadline_type: "soft",
      display_order: 0,
      required_documents: [],
    });
  };

  const openBatchDetail = (id) => {
    navigate(`/admin/milestones/${id}`);
  };

  const backToBatchList = () => {
    resetMilestoneForm();
    navigate("/admin/milestones");
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    const errors = validateBatchForm(batchForm, batchRange, batches);
    setBatchErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const start_date = batchRange.start.trim();
    const end_date = batchRange.end.trim();
    setBatchSubmitting(true);
    try {
      await milestones.createBatch({ ...batchForm, start_date, end_date });
      showToast("Đã tạo Đợt tốt nghiệp", "success");
      setBatchForm({ name: "", description: "" });
      setBatchRange({ start: "", end: "" });
      setBatchErrors({});
      await loadBatches();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Tạo Đợt tốt nghiệp thất bại";
      showToast(msg, "error");
    } finally {
      setBatchSubmitting(false);
    }
  };

  const executeDeleteBatch = async () => {
    if (deleteBatchId == null) return;
    const id = deleteBatchId;
    try {
      await milestones.removeBatch(id);
      showToast("Đã xóa Đợt tốt nghiệp", "success");
      setDeleteBatchId(null);
      await loadBatches();
      if (Number(id) === Number(selectedBatchId)) {
        navigate("/admin/milestones", { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Xóa Đợt tốt nghiệp thất bại";
      showToast(msg, "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatchId) {
      showToast("Vui lòng chọn Đợt tốt nghiệp", "error");
      return;
    }

    if (!editId && isBatchClosed(selectedBatch)) {
      showToast("Đợt tốt nghiệp đã kết thúc, không thể tạo mốc mới.", "error");
      return;
    }

    const errors = validateMilestoneForm(form, list, editId, selectedBatch);
    setMilestoneErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const required_documents = Array.isArray(form.required_documents)
        ? form.required_documents.map((s) => String(s).trim()).filter(Boolean)
        : [];
      const payload = {
        name: form.name.trim(),
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
        deadline_type: form.deadline_type,
        display_order: form.display_order,
        required_documents,
        graduation_batch_id: Number(selectedBatchId),
      };
      if (editId) {
        const result = await milestones.update(editId, payload);
        showToast(result?.message || "Cập nhật thành công!", "success");
      } else {
        await milestones.create(payload);
        showToast("Tạo milestone thành công!", "success");
      }
      resetMilestoneForm();
      setMilestoneErrors({});
      await loadMilestones();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lưu thất bại";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (m) => {
    setEditId(m.id);
    const docs = Array.isArray(m.required_documents)
      ? m.required_documents.map((s) => String(s).trim()).filter(Boolean)
      : typeof m.required_documents === "string" && m.required_documents.trim()
        ? m.required_documents.split("\n").map((s) => s.trim()).filter(Boolean)
        : [];
    setForm({
      name: m.name,
      description: m.description || "",
      start_date: m.start_date?.slice(0, 16) || "",
      end_date: m.end_date?.slice(0, 16) || "",
      deadline_type: m.deadline_type || "soft",
      display_order: m.display_order || 0,
      required_documents: docs,
    });
    setMilestoneErrors({});
    setShowForm(true);
  };

  const executeDeleteMilestone = async () => {
    if (deleteMilestoneId == null) return;
    const id = deleteMilestoneId;
    try {
      await milestones.remove(id);
      showToast("Đã xóa", "success");
      setDeleteMilestoneId(null);
      await loadMilestones();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Xóa thất bại";
      showToast(msg, "error");
    }
  };

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <ConfirmModal
        open={deleteBatchId != null}
        title="Xóa đợt tốt nghiệp"
        message="Xóa đợt này? Các mốc thời gian đang gắn với đợt có thể mất liên kết đợt."
        confirmLabel="Xóa đợt"
        cancelLabel="Hủy"
        danger
        onCancel={() => setDeleteBatchId(null)}
        onConfirm={executeDeleteBatch}
      />
      <ConfirmModal
        open={deleteMilestoneId != null}
        title="Xóa mốc thời gian"
        message="Xóa mốc này? Hành động không thể hoàn tác."
        confirmLabel="Xóa mốc"
        cancelLabel="Hủy"
        danger
        onCancel={() => setDeleteMilestoneId(null)}
        onConfirm={executeDeleteMilestone}
      />

      {!selectedBatchId ? (
        <>
          <div className="page-header">
            <h1>Mốc thời gian</h1>
            <p>Quản lý các Đợt tốt nghiệp</p>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">Tạo Đợt tốt nghiệp</div>
            <form onSubmit={handleCreateBatch} noValidate>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Tên đợt *</label>
                <input
                  className={inputClass(batchErrors.name)}
                  value={batchForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setBatchForm((f) => ({ ...f, name }));
                    if (batchErrors.name) clearFieldError(setBatchErrors, "name");
                  }}
                  placeholder="VD: Đợt tốt nghiệp K28"
                  aria-invalid={Boolean(batchErrors.name)}
                />
                <FieldError message={batchErrors.name} />
              </div>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", margin: "0 0 8px 0" }}>Khung thời gian *</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div className="form-group">
                  <label>Ngày bắt đầu *</label>
                  <input
                    type="datetime-local"
                    className={inputClass(batchErrors.start)}
                    value={batchRange.start}
                    onChange={(e) => {
                      const start = e.target.value;
                      setBatchRange((r) => ({ ...r, start }));
                      if (batchErrors.start) clearFieldError(setBatchErrors, "start");
                    }}
                    aria-invalid={Boolean(batchErrors.start)}
                  />
                  <FieldError message={batchErrors.start} />
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc *</label>
                  <input
                    type="datetime-local"
                    className={inputClass(batchErrors.end)}
                    value={batchRange.end}
                    onChange={(e) => {
                      const end = e.target.value;
                      setBatchRange((r) => ({ ...r, end }));
                      if (batchErrors.end) clearFieldError(setBatchErrors, "end");
                    }}
                    aria-invalid={Boolean(batchErrors.end)}
                  />
                  <FieldError message={batchErrors.end} />
                </div>
              </div>
              <textarea className="form-input" rows={2} style={{ marginTop: 4 }} value={batchForm.description} onChange={(e) => setBatchForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả đợt..." />
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-primary" disabled={batchSubmitting}>{batchSubmitting ? "Đang tạo..." : "Tạo Đợt tốt nghiệp"}</button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="card-title">Danh sách Đợt tốt nghiệp</div>
            {batches.length === 0 ? (
              <p style={{ color: "#64748b" }}>Chưa có đợt nào. Hãy tạo mới ở trên.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Tên đợt</th><th>Bắt đầu</th><th>Kết thúc</th><th></th></tr>
                </thead>
                <tbody>
                  {pagedBatches.map((b) => (
                    <tr key={b.id}>
                      <td><strong>{b.name}</strong></td>
                      <td>{formatDdMmYyyy(b.start_date)}</td>
                      <td>{formatDdMmYyyy(b.end_date)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-sm btn-primary" onClick={() => openBatchDetail(b.id)}>
                            <Icon name="OpenInNew" size={12} /> Quản lý mốc
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => setDeleteBatchId(b.id)}>
                            <Icon name="Delete" size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {batches.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
                <small style={{ color: "#64748b" }}>
                  Hiển thị {(safeBatchPage - 1) * BATCH_PAGE_SIZE + 1}–{Math.min(safeBatchPage * BATCH_PAGE_SIZE, batches.length)} / {batches.length} đợt
                  {" · "}
                  <strong>Trang {safeBatchPage} / {batchTotalPages}</strong>
                </small>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-sm btn-secondary" disabled={safeBatchPage <= 1} onClick={() => setBatchPage((p) => Math.max(1, p - 1))} aria-label="Trang trước">
                    &lt;
                  </button>
                  {batchPageItems.map((item, idx) =>
                    item === "ellipsis" ? (
                      <span key={`e-${idx}`} style={{ padding: "0 4px", color: "#94a3b8", userSelect: "none" }}>…</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        className={`btn btn-sm ${item === safeBatchPage ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setBatchPage(item)}
                      >
                        {item}
                      </button>
                    ),
                  )}
                  <button type="button" className="btn btn-sm btn-secondary" disabled={safeBatchPage >= batchTotalPages} onClick={() => setBatchPage((p) => Math.min(batchTotalPages, p + 1))} aria-label="Trang sau">
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <button className="btn btn-secondary btn-sm" onClick={backToBatchList} style={{ marginBottom: 8 }}>
                <Icon name="ArrowBack" size={12} /> Quay lại danh sách đợt
              </button>
              <h1>{selectedBatch?.name || "Đợt tốt nghiệp"}</h1>
              <p>Quản lý milestone của đợt này</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isBatchClosed(selectedBatch)}
              title={isBatchClosed(selectedBatch) ? "Đợt đã kết thúc — không thể tạo mốc mới" : undefined}
              onClick={() => {
                if (isBatchClosed(selectedBatch)) {
                  showToast("Đợt tốt nghiệp đã kết thúc, không thể tạo mốc mới.", "error");
                  return;
                }
                setEditId(null);
                setMilestoneErrors({});
                setForm((f) => ({
                  ...f,
                  name: "",
                  description: "",
                  start_date: "",
                  end_date: "",
                  deadline_type: "soft",
                  display_order: 0,
                  required_documents: [],
                }));
                setShowForm((v) => !v);
              }}
            >
              <Icon name="Plus" size={16} /> Thêm mốc mới
            </button>
          </div>

          {selectedBatch && isBatchClosed(selectedBatch) && (
            <div className="card" style={{ marginBottom: 16, borderLeft: "4px solid #f59e0b", background: "#fffbeb" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#92400e" }}>
                Đợt này đã qua ngày kết thúc — chỉ có thể chỉnh sửa hoặc xóa mốc hiện có, không thêm mốc mới.
              </p>
            </div>
          )}

          {showForm && (
            <div className="card">
              <div className="card-title">{editId ? "Chỉnh sửa" : "Tạo mốc mới"}</div>
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label>Tên mốc *</label>
                  <input
                    className={inputClass(milestoneErrors.name)}
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({ ...f, name }));
                      if (milestoneErrors.name) clearFieldError(setMilestoneErrors, "name");
                    }}
                    placeholder="VD: Proposal, Mid-term Report"
                    aria-invalid={Boolean(milestoneErrors.name)}
                  />
                  <FieldError message={milestoneErrors.name} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label>Ngày bắt đầu *</label>
                    <input
                      type="datetime-local"
                      className={inputClass(milestoneErrors.start_date)}
                      min={toDatetimeLocalSlice(selectedBatch?.start_date) || undefined}
                      max={toDatetimeLocalSlice(selectedBatch?.end_date) || undefined}
                      value={form.start_date}
                      onChange={(e) => {
                        const start_date = e.target.value;
                        setForm((f) => ({ ...f, start_date }));
                        if (milestoneErrors.start_date) clearFieldError(setMilestoneErrors, "start_date");
                      }}
                      aria-invalid={Boolean(milestoneErrors.start_date)}
                    />
                    <FieldError message={milestoneErrors.start_date} />
                  </div>
                  <div className="form-group">
                    <label>Ngày kết thúc *</label>
                    <input
                      type="datetime-local"
                      className={inputClass(milestoneErrors.end_date)}
                      min={toDatetimeLocalSlice(selectedBatch?.start_date) || undefined}
                      max={toDatetimeLocalSlice(selectedBatch?.end_date) || undefined}
                      value={form.end_date}
                      onChange={(e) => {
                        const end_date = e.target.value;
                        setForm((f) => ({ ...f, end_date }));
                        if (milestoneErrors.end_date) clearFieldError(setMilestoneErrors, "end_date");
                      }}
                      aria-invalid={Boolean(milestoneErrors.end_date)}
                    />
                    <FieldError message={milestoneErrors.end_date} />
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
                <div className="form-group">
                  <RequiredDocumentsPicker
                    resetKey={`${selectedBatchId}-${editId ?? "new"}`}
                    value={form.required_documents}
                    error={milestoneErrors.required_documents}
                    onChange={(docs) => {
                      setForm((f) => ({ ...f, required_documents: docs }));
                      if (milestoneErrors.required_documents && docs.some((d) => String(d).trim())) {
                        clearFieldError(setMilestoneErrors, "required_documents");
                      }
                    }}
                    disabled={submitting}
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Đang lưu..." : "Lưu"}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setMilestoneErrors({}); }}>Hủy</button>
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
                    <td>{formatDdMmYyyy(m.start_date)}</td>
                    <td>{formatDdMmYyyy(m.end_date)}</td>
                    <td><span className={`badge ${m.deadline_type === "hard" ? "badge-danger" : "badge-warning"}`}>{m.deadline_type === "hard" ? "Cứng" : "Mềm"}</span></td>
                    <td>{m.display_order}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(m)}><Icon name="Edit" size={13} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteMilestoneId(m.id)}><Icon name="Delete" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
