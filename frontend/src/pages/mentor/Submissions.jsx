import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/UI/Icon.jsx";
import { submissions } from "../../lib/api.js";
import { useMentorScopeRefresh } from "../../hooks/useMentorScopeRefresh.js";

export default function MentorSubmissions() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("all");

  const reloadSubmissions = useCallback(() => {
    return submissions.supervisor().then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    reloadSubmissions();
  }, [reloadSubmissions]);

  useMentorScopeRefresh(reloadSubmissions);

  const filtered = data.filter((s) => {
    if (filter === "all") return true;
    if (filter === "reviewed") return s.has_feedback;
    if (filter === "pending") return !s.has_feedback;
    if (filter === "late") return s.is_late;
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Bài nộp của sinh viên</h1>
        <p>Xem và đánh giá bài nộp từ các nhóm được phân công</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["all","Tất cả"],["pending","Chờ duyệt"],["reviewed","Đã duyệt"],["late","Trễ hạn"]].map(([k,v]) => (
          <button key={k} className={`btn ${filter === k ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter(k)}>{v}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <Icon name="Description" size={48} sx={{ opacity: 0.3 }} />
          <h3>Không có bài nộp</h3>
          <p>Danh sách bài nộp sẽ hiển thị ở đây</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Nhóm</th>
                <th>Mốc</th>
                <th>Ngày nộp</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.title}</strong></td>
                  <td>{s.team_name}</td>
                  <td>{s.milestone_name || "—"}</td>
                  <td>{new Date(s.submitted_at).toLocaleDateString("vi-VN")}</td>
                  <td>
                    {s.has_feedback ? (
                      <span className="badge badge-success"><Icon name="CheckCircle" size={12} /> Đã phản hồi</span>
                    ) : s.is_late ? (
                      <span className="badge badge-danger"><Icon name="Warning" size={12} /> Trễ</span>
                    ) : (
                      <span className="badge badge-warning"><Icon name="Schedule" size={12} /> Chờ duyệt</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => navigate(`/supervisor/review/${s.id}`)}>
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
