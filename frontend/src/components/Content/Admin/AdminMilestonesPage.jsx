import { useCallback, useState } from "react";
import {
  createMilestone,
  deleteMilestone,
  getMilestones,
  updateMilestone,
} from "../../../lib/api";
import { useAsyncResource } from "../../../hooks/useAsyncResource";
import Modal from "../../UI/Modal";
import "../../../styles/content.css";

function AdminMilestonesPage() {
  const [form, setForm] = useState({
    id: null,
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    sequenceNo: 0,
  });
  const [message, setMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const milestonesResource = useAsyncResource(useCallback(() => getMilestones(), []));
  const milestones = milestonesResource.data || [];

  const resetForm = () =>
    setForm({ id: null, name: "", description: "", startDate: "", endDate: "", sequenceNo: 0 });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.id) {
      await updateMilestone(form.id, form);
      setMessage("Cap nhat milestone thanh cong.");
    } else {
      await createMilestone(form);
      setMessage("Tao milestone thanh cong.");
    }
    resetForm();
    await milestonesResource.reload();
  };

  const handleDelete = async (id) => {
    await deleteMilestone(id);
    setMessage("Da xoa milestone.");
    setDeleteTarget(null);
    await milestonesResource.reload();
  };

  return (
    <div className="submissions-page">
      <h1 className="page-title">Milestone Management</h1>
      <form className="upload-card" onSubmit={handleSubmit}>
        <input className="field-control" placeholder="Name" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} required />
        <textarea className="mentor-feedback-textarea" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 8 }}>
          <input className="field-control" type="date" value={form.startDate} onChange={(e) => setForm((v) => ({ ...v, startDate: e.target.value }))} />
          <input className="field-control" type="date" value={form.endDate} onChange={(e) => setForm((v) => ({ ...v, endDate: e.target.value }))} />
          <input className="field-control" type="number" value={form.sequenceNo} onChange={(e) => setForm((v) => ({ ...v, sequenceNo: Number(e.target.value) }))} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" type="submit">{form.id ? "Update" : "Create"}</button>
          <button className="review-btn secondary" type="button" onClick={resetForm}>Reset</button>
        </div>
      </form>
      {message ? <div className="form-success" style={{ marginTop: 8 }}>{message}</div> : null}
      {milestonesResource.error ? <div className="form-error">{milestonesResource.error}</div> : null}

      <div className="table-wrap" style={{ marginTop: 18 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Start</th>
              <th>End</th>
              <th>Seq</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {milestones.map((milestone) => (
              <tr key={milestone.id}>
                <td>{milestone.id}</td>
                <td>{milestone.name}</td>
                <td>{milestone.start_date || "—"}</td>
                <td>{milestone.end_date || "—"}</td>
                <td>{milestone.sequence_no ?? "—"}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button className="review-btn secondary" type="button" onClick={() => setForm({
                    id: milestone.id,
                    name: milestone.name || "",
                    description: milestone.description || "",
                    startDate: milestone.start_date || "",
                    endDate: milestone.end_date || "",
                    sequenceNo: milestone.sequence_no || 0,
                  })}>Edit</button>
                  <button className="review-btn secondary" type="button" onClick={() => setDeleteTarget(milestone)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={Boolean(deleteTarget)}
        title="Xac nhan xoa milestone"
        onClose={() => setDeleteTarget(null)}
      >
        <p>Ban co chac muon xoa milestone <strong>{deleteTarget?.name || ""}</strong>?</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" type="button" onClick={() => handleDelete(deleteTarget.id)}>
            Xoa
          </button>
          <button className="review-btn secondary" type="button" onClick={() => setDeleteTarget(null)}>
            Huy
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default AdminMilestonesPage;
