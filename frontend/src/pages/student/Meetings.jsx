import { useState, useEffect, useMemo } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { meetings, teams } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";
import { topics } from "../../lib/api.js";
import { getMeetingTiming, partitionMeetingsByTiming } from "../../lib/meetingTiming.js";

export default function StudentMeetings() {
  const { toast, showToast } = useToast();
  const [meetingList, setMeetingList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [topicInfo, setTopicInfo] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);
  const [tab, setTab] = useState("meetings");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supervisor_id: "", title: "", reason: "", proposed_at: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      meetings.list(),
      meetings.studentRequests(),
      topics.myTopic(),
      teams.myTeam().catch(() => null),
    ]).then(([ml, req, topicRaw, teamData]) => {
      const teamsArr = Array.isArray(teamData) ? teamData : teamData ? [teamData] : [];
      const slots = Array.isArray(topicRaw) ? topicRaw : topicRaw && topicRaw.id ? [topicRaw] : [];
      const approvedSlot = slots.find((s) => s.topic?.status === "approved");
      const topic = approvedSlot?.topic || null;
      const team = teamsArr.find((x) => x.id === approvedSlot?.team_id) || teamsArr[0] || null;
      setMeetingList(ml);
      setRequests(req);
      setTopicInfo(topic || null);
      setTeamInfo(team || null);
      const supervisorId = topic?.supervisor_id || team?.supervisor_user_id || "";
      if (supervisorId) setForm((f) => ({ ...f, supervisor_id: String(supervisorId) }));
    }).catch(() => {});
  }, []);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!form.supervisor_id) {
      showToast("Nhóm chưa có giảng viên hướng dẫn. Hãy chờ đề tài được duyệt trước khi gửi yêu cầu họp.", "error");
      return;
    }
    if (!form.title || !form.proposed_at) {
      showToast("Vui lòng điền đầy đủ thông tin", "error"); return;
    }
    setSubmitting(true);
    try {
      await meetings.request(form);
      showToast("Gửi yêu cầu thành công!", "success");
      setShowForm(false);
      setForm((f) => ({ ...f, title: "", reason: "", proposed_at: "" }));
      const req = await meetings.studentRequests();
      setRequests(req);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const { upcomingMeetings, pastMeetings } = useMemo(
    () => partitionMeetingsByTiming(meetingList),
    [meetingList],
  );

  const MeetingCard = ({ m }) => {
    const timing = m._timing || getMeetingTiming(m);
    return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600 }}>{m.title}</h3>
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: "0.82rem", color: "#64748b" }}>
            <span><Icon name="Clock" size={13} /> {new Date(m.scheduled_at).toLocaleString("vi-VN")} ({m.duration_minutes} phút)</span>
            {m.location && <span><Icon name="MapPin" size={13} /> {m.location}</span>}
            {m.meeting_url && <span><Icon name="Video" size={13} /> <a href={m.meeting_url} target="_blank" rel="noreferrer" style={{ color: "#3b82f6" }}>Link</a></span>}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
            Người chủ trì: {m.host_name} {m.team_name ? `• Nhóm: ${m.team_name}` : ""}
          </div>
        </div>
        <span className={`badge ${timing.badgeClass}`}>{timing.label}</span>
      </div>
    </div>
    );
  };

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Lịch họp</h1>
          <p>Xem cuộc họp và gửi yêu cầu họp mới</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          <Icon name="Plus" size={16} /> Yêu cầu họp
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-title">Gửi yêu cầu họp</div>
          <form onSubmit={handleRequest}>
            <div className="form-group">
              <label>Giảng viên nhận yêu cầu</label>
              <input
                className="form-input"
                value={topicInfo?.supervisor_name || teamInfo?.supervisor_name || "Chưa có giảng viên hướng dẫn"}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Tiêu đề cuộc họp *</label>
              <input className="form-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="VD: Họp tiến độ dự án" />
            </div>
            <div className="form-group">
              <label>Ngày/giờ đề xuất *</label>
              <input type="datetime-local" className="form-input" value={form.proposed_at} onChange={(e) => setForm((f) => ({ ...f, proposed_at: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Lý do</label>
              <textarea className="form-input" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Mục đích cuộc họp..." />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={`btn ${tab === "meetings" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("meetings")}>
          Cuộc họp
        </button>
        <button className={`btn ${tab === "requests" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("requests")}>
          Yêu cầu ({requests.filter((r) => r.status === "pending").length})
        </button>
      </div>

      {tab === "meetings" && (
        <>
          {upcomingMeetings.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 12 }}>Sắp tới</h3>
              {upcomingMeetings.map((m) => <MeetingCard key={m.id} m={m} />)}
            </div>
          )}
          {pastMeetings.length > 0 && (
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 12, color: "#64748b" }}>Đã qua</h3>
              {pastMeetings.map((m) => <MeetingCard key={m.id} m={m} />)}
            </div>
          )}
          {meetingList.length === 0 && (
            <div className="card empty-state">
              <Icon name="Calendar" size={48} sx={{ opacity: 0.3 }} />
              <h3>Chưa có cuộc họp nào</h3>
              <p>Gửi yêu cầu họp để liên hệ giảng viên</p>
            </div>
          )}
        </>
      )}

      {tab === "requests" && (
        <>
          {requests.length === 0 ? (
            <div className="card empty-state">
              <Icon name="Calendar" size={48} sx={{ opacity: 0.3 }} />
              <h3>Chưa có yêu cầu nào</h3>
            </div>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <strong>{r.title}</strong>
                    <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 4 }}>
                      Giảng viên: {r.supervisor_name} • {new Date(r.proposed_at).toLocaleString("vi-VN")}
                    </div>
                    {r.reason && <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 4 }}>{r.reason}</p>}
                  </div>
                  <span className={`badge ${r.status === "approved" ? "badge-success" : r.status === "declined" ? "badge-danger" : "badge-warning"}`}>
                    {r.status === "approved" ? <Icon name="CheckCircle" size={12} /> : r.status === "declined" ? <Icon name="XCircle" size={12} /> : <Icon name="Clock" size={12} />}
                    {" "}{r.status === "approved" ? "Chấp nhận" : r.status === "declined" ? "Từ chối" : "Chờ"}
                  </span>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
