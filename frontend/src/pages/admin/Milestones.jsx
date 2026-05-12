import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/UI/Icon.jsx";
import { milestones } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";

export default function AdminMilestones() {
  const { toast, showToast } = useToast();
  const navigate = useNavigate();
  const { batchId: batchIdParam } = useParams();
  const selectedBatchId = batchIdParam ? Number(batchIdParam) : null;
  const [batches, setBatches] = useState([]);
  const [list, setList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [batchForm, setBatchForm] = useState({ name: "", description: "", start_date: "", end_date: "" });
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    deadline_type: "soft",
    display_order: 0,
    required_documents_text: "",
  });
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (selectedBatchId && batches.length > 0 && !selectedBatch) {
      showToast("Đợt tốt nghiệp không tồn tại hoặc đã bị xóa", "error");
      navigate("/admin/milestones", { replace: true });
    }
  }, [selectedBatchId, selectedBatch, batches, navigate, showToast]);

  const resetMilestoneForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      deadline_type: "soft",
      display_order: 0,
      required_documents_text: "",
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
    if (!batchForm.name.trim()) {
      showToast("Tên Đợt tốt nghiệp không được trống", "error");
      return;
    }
    setBatchSubmitting(true);
    try {
      await milestones.createBatch(batchForm);
      showToast("Đã tạo Đợt tốt nghiệp", "success");
      setBatchForm({ name: "", description: "", start_date: "", end_date: "" });
      await loadBatches();
    } catch (err) {
      showToast(err.message || "Tạo Đợt tốt nghiệp thất bại", "error");
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!confirm("Xóa Đợt tốt nghiệp này? (các mốc đang gắn sẽ mất liên kết)")) return;
    try {
      await milestones.removeBatch(id);
      showToast("Đã xóa Đợt tốt nghiệp", "success");
      await loadBatches();
      if (Number(id) === Number(selectedBatchId)) {
        navigate("/admin/milestones", { replace: true });
      }
    } catch (err) {
      showToast(err.message || "Xóa Đợt tốt nghiệp thất bại", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatchId) { showToast("Vui lòng chọn Đợt tốt nghiệp", "error"); return; }
    if (!form.name || !form.start_date || !form.end_date) { showToast("Điền đầy đủ thông tin", "error"); return; }
    setSubmitting(true);
    try {
      const required_documents = form.required_documents_text
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        name: form.name,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
        deadline_type: form.deadline_type,
        display_order: form.display_order,
        required_documents,
        graduation_batch_id: Number(selectedBatchId),
      };
      if (editId) {
        await milestones.update(editId, payload);
        showToast("Cập nhật thành công!", "success");
      } else {
        await milestones.create(payload);
        showToast("Tạo milestone thành công!", "success");
      }
      resetMilestoneForm();
      await loadMilestones();
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
      required_documents_text: Array.isArray(m.required_documents) ? m.required_documents.join("\n") : "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa mốc thời gian này?")) return;
    try {
      await milestones.remove(id);
      showToast("Đã xóa", "success");
      await loadMilestones();
    } catch (err) { showToast(err.message, "error"); }
  };

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      {!selectedBatchId ? (
        <>
          <div className="page-header">
            <h1>Mốc thời gian</h1>
            <p>Quản lý các Đợt tốt nghiệp</p>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">Tạo Đợt tốt nghiệp</div>
            <form onSubmit={handleCreateBatch}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                <input className="form-input" value={batchForm.name} onChange={(e) => setBatchForm((f) => ({ ...f, name: e.target.value }))} placeholder="Tên đợt (VD: Đợt tốt nghiệp K28)" />
                <input type="date" className="form-input" value={batchForm.start_date} onChange={(e) => setBatchForm((f) => ({ ...f, start_date: e.target.value }))} />
                <input type="date" className="form-input" value={batchForm.end_date} onChange={(e) => setBatchForm((f) => ({ ...f, end_date: e.target.value }))} />
              </div>
              <textarea className="form-input" rows={2} style={{ marginTop: 8 }} value={batchForm.description} onChange={(e) => setBatchForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả đợt..." />
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
                  {batches.map((b) => (
                    <tr key={b.id}>
                      <td><strong>{b.name}</strong></td>
                      <td>{b.start_date ? new Date(b.start_date).toLocaleDateString("vi-VN") : "—"}</td>
                      <td>{b.end_date ? new Date(b.end_date).toLocaleDateString("vi-VN") : "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-sm btn-primary" onClick={() => openBatchDetail(b.id)}>
                            <Icon name="OpenInNew" size={12} /> Quản lý mốc
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteBatch(b.id)}>
                            <Icon name="Delete" size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <button className="btn btn-primary" onClick={() => { setEditId(null); setShowForm((v) => !v); }}>
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
                <div className="form-group">
                  <label>Tài liệu cần nộp (mỗi dòng một mục)</label>
                  <textarea className="form-input" rows={5} value={form.required_documents_text} onChange={(e) => setForm((f) => ({ ...f, required_documents_text: e.target.value }))} />
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
                    <td><span className={`badge ${m.deadline_type === "hard" ? "badge-danger" : "badge-warning"}`}>{m.deadline_type === "hard" ? "Cứng" : "Mềm"}</span></td>
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
        </>
      )}
    </div>
  );
}
