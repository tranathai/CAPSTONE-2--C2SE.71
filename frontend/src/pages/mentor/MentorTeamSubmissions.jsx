import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Icon from "../../components/UI/Icon.jsx";
import { submissions, topics } from "../../lib/api.js";
import { useMentorScopeRefresh } from "../../hooks/useMentorScopeRefresh.js";

export default function MentorTeamSubmissions() {
  const { teamId: teamIdParam } = useParams();
  const teamId = Number(teamIdParam);
  const navigate = useNavigate();
  const location = useLocation();
  const topicFromState = location.state?.topic;

  const [data, setData] = useState([]);
  const [topicMeta, setTopicMeta] = useState(topicFromState || null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const reloadSubmissions = useCallback(() => {
    if (!teamId || teamId <= 0) return Promise.resolve();
    return submissions.supervisor(teamId).then(setData).catch(() => setData([]));
  }, [teamId]);

  useEffect(() => {
    if (!teamId || teamId <= 0) {
      navigate("/supervisor/submissions", { replace: true });
      return;
    }
    setLoading(true);
    Promise.all([
      reloadSubmissions(),
      topicFromState
        ? Promise.resolve()
        : topics
            .approved()
            .then((list) => {
              const found = (Array.isArray(list) ? list : []).find((t) => Number(t.team_id) === teamId);
              if (found) setTopicMeta(found);
            })
            .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [teamId, reloadSubmissions, topicFromState, navigate]);

  useMentorScopeRefresh(reloadSubmissions);

  const filtered = useMemo(
    () =>
      data.filter((s) => {
        if (filter === "all") return true;
        if (filter === "reviewed") return s.has_feedback;
        if (filter === "pending") return !s.has_feedback;
        if (filter === "late") return s.is_late;
        return true;
      }),
    [data, filter],
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-screen">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => navigate("/supervisor/submissions")}
        >
          <Icon name="ArrowBack" size={14} /> Danh sách đề tài
        </button>
      </div>

      <div className="page-header">
        <h1>{topicMeta?.title || "Tài liệu nhóm"}</h1>
        <p>
          Nhóm: <strong>{topicMeta?.team_name || "—"}</strong>
          {topicMeta?.semester ? ` • ${topicMeta.semester}` : ""}
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["all", "Tất cả"], ["pending", "Chờ duyệt"], ["reviewed", "Đã duyệt"], ["late", "Trễ hạn"]].map(([k, v]) => (
          <button
            key={k}
            type="button"
            className={`btn ${filter === k ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter(k)}
          >
            {v}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <Icon name="Description" size={48} sx={{ opacity: 0.3 }} />
          <h3>Chưa có tài liệu nộp</h3>
          <p>Nhóm chưa upload bài cho mốc nào hoặc không khớp bộ lọc.</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tài liệu</th>
                <th>Mốc</th>
                <th>Ngày nộp</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.title}</strong>
                  </td>
                  <td>{s.milestone_name || "—"}</td>
                  <td>{new Date(s.submitted_at).toLocaleDateString("vi-VN")}</td>
                  <td>
                    {s.has_feedback ? (
                      <span className="badge badge-success">
                        <Icon name="CheckCircle" size={12} /> Đã phản hồi
                      </span>
                    ) : s.is_late ? (
                      <span className="badge badge-danger">
                        <Icon name="Warning" size={12} /> Trễ
                      </span>
                    ) : (
                      <span className="badge badge-warning">
                        <Icon name="Schedule" size={12} /> Chờ duyệt
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() =>
                        navigate(`/supervisor/review/${s.id}`, {
                          state: { teamId, topic: topicMeta },
                        })
                      }
                    >
                      <Icon name="Visibility" size={14} /> Xem & Phản hồi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
