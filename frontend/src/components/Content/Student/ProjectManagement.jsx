import { useEffect, useMemo, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { API_ORIGIN, listSubmissions, uploadSubmission } from "../../../lib/api";
import "../../../styles/content.css";

const PROJECT_SUBMISSIONS_KEY = "mentorai_project_submissions";

function readProjectSubmissions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROJECT_SUBMISSIONS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function findSubmissionById(submissionId) {
  const submissions = readProjectSubmissions();
  return submissions.find((item) => String(item.id) === String(submissionId)) || null;
}

function badgeClass(status) {
  if (!status) return "pm-badge pending";
  const normalized = String(status).toLowerCase();
  if (normalized.includes("reviewed")) return "pm-badge reviewed";
  if (normalized.includes("pending")) return "pm-badge pending";
  return "pm-badge";
}

function ProjectManagement({ teamId: propTeamId, projectItem: propProjectItem }) {
  const { teamId: paramTeamId } = useParams();
  const projectItem = propProjectItem || null;
  const teamId = propTeamId || paramTeamId || projectItem?.teamId || projectItem?.submissionId || null;
  const numericTeamId = Number(teamId);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const isApprovedProject = projectItem?.kind === "approved";

  async function reload() {
    if (isApprovedProject) {
      setItems([]);
      return;
    }

    const data = await listSubmissions(
      Number.isInteger(numericTeamId) && numericTeamId > 0 ? { team_id: numericTeamId } : {},
    );
    setItems(data);
  }

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        setLoading(true);
        setError("");
        if (isApprovedProject) {
          if (active) setItems([]);
          return;
        }

        const data = await listSubmissions(
          Number.isInteger(numericTeamId) && numericTeamId > 0
            ? { team_id: numericTeamId }
            : {},
        );
        if (active) setItems(data);
      } catch (e) {
        if (active) setError(e.message || "Không tải được dữ liệu project");
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [numericTeamId, isApprovedProject]);

  const approvedProject = useMemo(() => {
    if (!isApprovedProject) {
      return null;
    }

    if (projectItem?.submissionId) {
      return findSubmissionById(projectItem.submissionId) || null;
    }

    return null;
  }, [isApprovedProject, projectItem]);

  const project = useMemo(() => {
    if (isApprovedProject) {
      return approvedProject || {
        id: projectItem?.submissionId || projectItem?.id,
        title: projectItem?.name,
        projectTitle: projectItem?.name,
        team_name: projectItem?.name,
        student_name: "",
        teamMembers: [],
        roadmapMilestones: [],
      };
    }

    return items[0] || null;
  }, [approvedProject, items, isApprovedProject, projectItem]);

  const projectMembers = useMemo(() => {
    if (isApprovedProject) {
      return Array.isArray(project?.teamMembers) ? project.teamMembers : [];
    }

    return [
      {
        email: project?.student_email || project?.studentEmail || "nguyenvana@gmail.com",
        fullName: project?.student_name || project?.studentName || "Nguyen Van A",
        isLeader: true,
      },
    ];
  }, [project, isApprovedProject]);

  const projectMilestones = useMemo(() => {
    if (isApprovedProject) {
      return Array.isArray(project?.roadmapMilestones) ? project.roadmapMilestones : [];
    }

    return [
      { id: "proposal", title: "Proposal" },
      { id: "milestone-1", title: "Milestone 1" },
      { id: "milestone-2", title: "Milestone 2" },
      { id: "final", title: "Final Report" },
    ];
  }, [project, isApprovedProject]);

  function resolveFileUrl(row) {
    const direct = row?.file_url || row?.fileUrl;
    if (direct && /^https?:\/\//i.test(direct)) return direct;

    const filePath = row?.file_path || row?.filePath || "";
    if (!filePath) return "";
    if (/^https?:\/\//i.test(filePath)) return filePath;
    if (filePath.startsWith("/")) return `${API_ORIGIN}${filePath}`;
    return `${API_ORIGIN}/${filePath}`;
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Vui lòng chọn file để tải lên.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      const fd = new FormData();
      if (Number.isInteger(numericTeamId) && numericTeamId > 0) {
        fd.append("team_id", String(numericTeamId));
      }
      if (uploadTitle.trim()) fd.append("title", uploadTitle.trim());
      fd.append("file", uploadFile);

      await uploadSubmission(fd);
      await reload();

      setUploadOpen(false);
      setUploadTitle("");
      setUploadFile(null);
    } catch (err) {
      setUploadError(err?.message || "Upload thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="pm-page">
      <section className="pm-card pm-hero">
        <img
          className="pm-hero-cover"
          src="https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=256&q=80"
          alt="Project cover"
        />
        <div>
          <h1 className="pm-hero-title">
            {project?.title || project?.projectTitle || projectItem?.name || "Eco-Track: Sustainable Campus Initiative"}
          </h1>
          <p className="pm-hero-meta">{`Group Project: ${project?.team_name || projectItem?.name || "C2SE71"}`}</p>
          <p className="pm-hero-meta">Project Mentor: Alex</p>
        </div>
      </section>

      <section className="pm-card">
        <h2 className="pm-section-title">Project Users</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>PROJECT</th>
                <th>ID STUDENT</th>
                <th>STUDENT</th>
                <th>LEADER</th>
                <th>PHONE</th>
                <th>EMAIL</th>
              </tr>
            </thead>
            <tbody>
              {projectMembers.length > 0 ? (
                projectMembers.map((member, index) => (
                  <tr key={`${member.email || member.fullName || index}`}>
                    <td>{project?.team_name || projectItem?.name || "C2SE71"}</td>
                    <td>{index === 0 ? "28201152213" : "—"}</td>
                    <td>{member.fullName || member.name || "Nguyen Van A"}</td>
                    <td>{index === 0 || member.isLeader ? "☑" : ""}</td>
                    <td>{index === 0 ? "0797446259" : "—"}</td>
                    <td>{member.email || "nguyenvana@gmail.com"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>{project?.team_name || projectItem?.name || "C2SE71"}</td>
                  <td>28201152213</td>
                  <td>{project?.student_name || "Nguyen Van A"}</td>
                  <td>☑</td>
                  <td>0797446259</td>
                  <td>nguyenvana@gmail.com</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pm-card pm-workflow">
        <h2 className="pm-section-title">Project Workflow</h2>
        <div className="pm-steps">
          {projectMilestones.length > 0 ? (
            projectMilestones.map((milestone, index) => (
              <span key={milestone.id || milestone.title} className={index === 0 ? "active" : ""}>
                {milestone.title || milestone.label || `Milestone ${index + 1}`}
              </span>
            ))
          ) : (
            <>
              <span className="active">Proposal</span>
              <span>Milestone 1</span>
              <span>Milestone 2</span>
              <span>Final Report</span>
            </>
          )}
        </div>
      </section>

      <section className="pm-card">
        <div className="pm-title-row">
          <h2 className="pm-section-title">Project Deliverables</h2>
          {!isApprovedProject ? (
            <button
              type="button"
              className="pm-icon-btn"
              onClick={() => {
                setUploadError("");
                setUploadOpen(true);
              }}
              aria-label="Upload tài liệu"
              title="Upload tài liệu"
            >
              <UploadCloud size={18} />
            </button>
          ) : null}
        </div>
        {isApprovedProject ? (
          <div className="page-muted">Chua co tai lieu duoc upload cho project nay.</div>
        ) : loading ? (
          <p className="page-status">Đang tải danh sách…</p>
        ) : error ? (
          <p className="form-error">{error}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NO.</th>
                  <th>NAME</th>
                  <th>DATE</th>
                  <th>FILE NAME</th>
                  <th>STATUS</th>
                  <th>VIEW</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => {
                  const fileUrl = resolveFileUrl(row);
                  const fileName = row.file_name || row.file_path?.split("/").pop() || "—";
                  return (
                    <tr key={row.id}>
                      <td>{idx + 1}</td>
                      <td>{row.title || "Tài liệu dự án"}</td>
                      <td>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString("vi-VN")
                          : "10/2/2026"}
                      </td>
                      <td>
                        {fileUrl ? (
                          <a className="table-link" href={fileUrl} target="_blank" rel="noreferrer">
                            {fileName}
                          </a>
                        ) : (
                          fileName
                        )}
                      </td>
                      <td>
                        <span className={badgeClass(row.status_label || "Pending Review")}>
                          {row.status_label || "Pending Review"}
                        </span>
                      </td>
                      <td>
                        <Link className="table-link" to={`/student/review/${row.id}`}>
                          Xem
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!isApprovedProject && uploadOpen ? (
        <div
          className="upload-dialog-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !uploading) {
              setUploadOpen(false);
              setUploadError("");
            }
          }}
        >
          <form className="upload-dialog" onSubmit={handleUploadSubmit}>
            <div className="pm-title-row">
              <h3 className="section-title" style={{ margin: 0 }}>
                Tải tài liệu lên
              </h3>
              <button
                type="button"
                className="pm-icon-btn"
                onClick={() => {
                  if (!uploading) {
                    setUploadOpen(false);
                    setUploadError("");
                  }
                }}
                aria-label="Đóng"
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="upload-dialog-grid">
              <label className="field-label">
                Tên tài liệu (tuỳ chọn)
                <input
                  className="field-control"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Ví dụ: Milestone 1 Report"
                  disabled={uploading}
                />
              </label>

              <label className="field-label">
                File
                <input
                  className="field-control"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
              </label>
            </div>

            {uploadFile ? (
              <div className="page-muted">{`Đã chọn: ${uploadFile.name}`}</div>
            ) : (
              <div className="page-muted">Chọn file để upload (pdf/doc/docx/zip...)</div>
            )}

            {uploadError ? <div className="form-error">{uploadError}</div> : null}

            <div className="upload-dialog-actions">
              <button
                type="button"
                className="upload-cancel-btn"
                onClick={() => {
                  if (!uploading) {
                    setUploadOpen(false);
                    setUploadError("");
                  }
                }}
                disabled={uploading}
              >
                Hủy
              </button>
              <button className="btn-primary" type="submit" disabled={uploading}>
                {uploading ? "Đang tải lên…" : "Upload"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default ProjectManagement;
