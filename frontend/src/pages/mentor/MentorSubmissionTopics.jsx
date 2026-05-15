import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/UI/Icon.jsx";
import { topics } from "../../lib/api.js";
import { useMentorScopeRefresh } from "../../hooks/useMentorScopeRefresh.js";

export default function MentorSubmissionTopics() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    return topics
      .approved()
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useMentorScopeRefresh(reload);

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
      <div className="page-header">
        <h1>Bài nộp của sinh viên</h1>
        <p>Chọn đề tài / nhóm để xem danh sách tài liệu đã nộp</p>
      </div>

      {list.length === 0 ? (
        <div className="card empty-state">
          <Icon name="Folder" size={48} sx={{ opacity: 0.3 }} />
          <h3>Chưa có đề tài đã duyệt</h3>
          <p>Các nhóm được phân công sẽ hiển thị tại đây sau khi bạn duyệt đề tài.</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Đề tài</th>
                <th>Nhóm</th>
                <th>Học kỳ</th>
                <th>Thành viên</th>
                <th>Tài liệu</th>
                <th>Chờ phản hồi</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr
                  key={t.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/supervisor/submissions/team/${t.team_id}`, { state: { topic: t } })}
                >
                  <td>
                    <strong>{t.title}</strong>
                    {t.technologies ? (
                      <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>{t.technologies}</div>
                    ) : null}
                  </td>
                  <td>{t.team_name}</td>
                  <td>{t.semester || "—"}</td>
                  <td>{t.member_count ?? "—"}</td>
                  <td>{Number(t.submission_count) || 0}</td>
                  <td>
                    {Number(t.pending_submission_count) > 0 ? (
                      <span className="badge badge-warning">{t.pending_submission_count}</span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>0</span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/supervisor/submissions/team/${t.team_id}`, { state: { topic: t } })}
                    >
                      <Icon name="Description" size={14} /> Xem tài liệu
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
