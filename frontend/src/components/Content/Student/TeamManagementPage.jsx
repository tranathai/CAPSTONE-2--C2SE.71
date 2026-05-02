import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTeamManagement } from "../../../lib/api";
import { useRuntimeRole } from "../../../config/runtimeRole";
import "../../../styles/teamManager.css";

function TeamManagementPage() {
  const role = useRuntimeRole();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await getTeamManagement(
          { studentName, teamName },
          role
        );

        if (active) {
          setData(res || []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Không tải được dữ liệu");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => (active = false);
  }, [studentName, teamName, role]);

  return (
    <div className="team-container">
      <h2 className="title">
        {role === "supervisor"
          ? "Mentor - Team Management"
          : "Student - Team Management"}
      </h2>

      <div className="filter-bar">
        <input
          placeholder="Tên sinh viên..."
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />
        <input
          placeholder="Tên nhóm..."
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <table className="team-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Nhóm</th>
              <th>Đề tài</th>
              <th>Progress</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => {
              const progress = item.progress || 0;

              return (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.team_name}</td>

                  {/* 🔥 CLICK THEO ROLE */}
                  <td>
                    <span
                      className="link-project"
                      onClick={() => {
                        if (role === "supervisor") {
                          // 👉 MENTOR
                          if (item.submission_id) {
                            navigate(
                              `/mentor/review/${item.submission_id}`
                            );
                          } else {
                            alert("Chưa có bài nộp");
                          }
                        } else {
                          // 👉 STUDENT (GIỮ NGUYÊN ROUTE CỦA BẠN)
                          navigate(
                            `/student/project-management/${item.team_id}`
                          );
                        }
                      }}
                    >
                      {item.project_title || "Chưa có"}
                    </span>
                  </td>

                  <td>{progress}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TeamManagementPage;