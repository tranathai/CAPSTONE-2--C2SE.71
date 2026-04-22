import { useCallback, useState } from "react";
import { createTopic, listTopics } from "../../../lib/api";
import { useAsyncResource } from "../../../hooks/useAsyncResource";
import "../../../styles/content.css";

function StudentTopicsPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [technologiesUsed, setTechnologiesUsed] = useState("");
  const [status, setStatus] = useState("all");

  const loadTopics = useCallback(
    () => listTopics(status === "all" ? { onlyMine: "1" } : { onlyMine: "1", status }),
    [status],
  );
  const { data, loading, error, reload } = useAsyncResource(loadTopics);
  const topics = data || [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    await createTopic({ title, description, technologiesUsed });
    setTitle("");
    setDescription("");
    setTechnologiesUsed("");
    await reload();
  };

  return (
    <div className="submissions-page">
      <h1 className="page-title">Topic Registration</h1>
      <form className="upload-card" onSubmit={handleSubmit}>
        <input className="field-control" placeholder="Topic title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="mentor-feedback-textarea" rows={4} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <input className="field-control" placeholder="Technologies used" value={technologiesUsed} onChange={(e) => setTechnologiesUsed(e.target.value)} required />
        <button className="btn-primary" type="submit">Submit topic</button>
      </form>

      <div className="page-header-row" style={{ marginTop: 20 }}>
        <select className="field-control" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 260 }}>
          <option value="all">All statuses</option>
          <option value="PendingApproval">PendingApproval</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
      {loading ? <div className="page-status">Dang tai topic...</div> : null}
      {error ? <div className="form-error">{error}</div> : null}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Technologies</th>
              <th>Rejection reason</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <tr key={topic.id}>
                <td>{topic.id}</td>
                <td>{topic.title}</td>
                <td>{topic.status}</td>
                <td>{topic.technologies_used}</td>
                <td>{topic.rejection_reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentTopicsPage;
