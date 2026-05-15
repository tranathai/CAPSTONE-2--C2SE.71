import { useState, useEffect, useCallback, useMemo } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { meetings, teams } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";
import { useMentorScopeRefresh } from "../../hooks/useMentorScopeRefresh.js";
import { getMeetingTiming, partitionMeetingsByTiming } from "../../lib/meetingTiming.js";

function MeetingRow({ m, onSelect, dimmed = false }) {
  const timing = m._timing || getMeetingTiming(m);
  return (
    <div
      className="card"
      style={{
        marginBottom: 10,
        cursor: "pointer",
        opacity: dimmed ? 0.88 : 1,
        borderLeft: `4px solid ${timing.bucket === "upcoming" ? "#22c55e" : "#94a3b8"}`,
      }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{m.title}</strong>
          <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 4 }}>
            <Icon name="Schedule" size={12} /> {new Date(m.scheduled_at).toLocaleString("vi-VN")} ({m.duration_minutes || 60} phút)
            {m.team_name && (
              <span style={{ marginLeft: 12 }}>
                <Icon name="Group" size={12} /> {m.team_name}
              </span>
            )}
            {m.location && (
              <span style={{ marginLeft: 12 }}>
                <Icon name="LocationOn" size={12} /> {m.location}
              </span>
            )}
          </div>
          {m.meeting_url && (
            <a
              href={m.meeting_url}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: "0.8rem", color: "#3b82f6", marginTop: 4, display: "inline-block" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Icon name="Videocam" size={12} /> Link họp
            </a>
          )}
        </div>
        <span className={`badge ${timing.badgeClass}`}>{timing.label}</span>
      </div>
    </div>
  );
}

export default function MentorMeetings() {
  const { toast, showToast } = useToast();
  const [meetingList, setMeetingList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [tab, setTab] = useState("meetings");
  const [meetingFilter, setMeetingFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", scheduled_at: "", duration_minutes: 60, team_id: "", meeting_url: "", location: "" });
  const [submitting, setSubmitting] = useState(false);
  const [approveForm, setApproveForm] = useState(null);
  const [approveData, setApproveData] = useState({});
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const selectedMeeting = meetingList.find((m) => Number(m.id) === Number(selectedMeetingId)) || null;

  const { upcomingMeetings, pastMeetings } = useMemo(
    () => partitionMeetingsByTiming(meetingList),
    [meetingList],
  );

  const filteredMeetings = useMemo(() => {
    if (meetingFilter === "upcoming") return upcomingMeetings;
    if (meetingFilter === "past") return pastMeetings;
    return [...upcomingMeetings, ...pastMeetings];
  }, [meetingFilter, upcomingMeetings, pastMeetings]);

  const reloadMeetingsPage = useCallback(() => {
    return Promise.all([meetings.list(), meetings.supervisorRequests(), teams.supervisees()])
      .then(([ml, req, tl]) => {
        setMeetingList(ml);
        setRequests(req);
        setTeamList(tl);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    reloadMeetingsPage();
  }, [reloadMeetingsPage]);

  useMentorScopeRefresh(reloadMeetingsPage);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.scheduled_at) { showToast("Điền đầy đủ thông tin bắt buộc", "error"); return; }
    setSubmitting(true);
    try {
      await meetings.create(form);
      showToast("Tạo cuộc họp thành công!", "success");
      setShowForm(false);
      const ml = await meetings.list();
      setMeetingList(ml);
    } catch (err) { showToast(err.message, "error"); }
    finally { setSubmitting(false); }
  };

  const handleApprove = async (reqId) => {
    try {
      await meetings.approveRequest(reqId, approveData[reqId] || {});
      showToast("Chấp nhận yêu cầu!", "success");
      const req = await meetings.supervisorRequests();
      setRequests(req);
      setApproveForm(null);
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleDecline = async (reqId) => {
    const reason = prompt("Lý do từ chối:");
    if (!reason) return;
    try {
      await meetings.declineRequest(reqId, reason);
      showToast("Đã từ chối", "success");
      const req = await meetings.supervisorRequests();
      setRequests(req);
    } catch (err) { showToast(err.message, "error"); }
  };

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Quản lý cuộc họp</h1>
          <p>Tạo cuộc họp và xử lý yêu cầu từ sinh viên</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          <Icon name="Add" size={16} /> Tạo cuộc họp
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-title">Tạo cuộc họp mới</div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Tiêu đề *</label>
              <input className="form-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Ngày/giờ *</label>
                <input type="datetime-local" className="form-input" value={form.scheduled_at} onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Thời lượng (phút)</label>
                <input type="number" className="form-input" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label>Địa điểm</label>
                <input className="form-input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Phòng 301" />
              </div>
            </div>
            <div className="form-group">
              <label>Nhóm</label>
              <select className="form-input" value={form.team_id} onChange={(e) => setForm((f) => ({ ...f, team_id: e.target.value }))}>
                <option value="">-- Chọn nhóm (tùy chọn) --</option>
                {teamList.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Link họp (Zoom/Meet)</label>
              <input className="form-input" value={form.meeting_url} onChange={(e) => setForm((f) => ({ ...f, meeting_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Đang tạo..." : "Tạo cuộc họp"}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={`btn ${tab === "meetings" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("meetings")}>Cuộc họp</button>
        <button className={`btn ${tab === "requests" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("requests")}>
          Yêu cầu ({requests.filter((r) => r.status === "pending").length})
        </button>
      </div>

      {selectedMeeting && (
        <div className="modal-overlay" role="presentation" onClick={() => setSelectedMeetingId(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="meeting-detail-title"
            style={{ position: "relative", paddingTop: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="import-report-close"
              aria-label="Đóng"
              onClick={() => setSelectedMeetingId(null)}
            >
              <Icon name="Close" size={16} />
            </button>
            <h3 id="meeting-detail-title" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {selectedMeeting.title || "Chi tiết cuộc họp"}
              <span className={`badge ${getMeetingTiming(selectedMeeting).badgeClass}`}>
                {getMeetingTiming(selectedMeeting).label}
              </span>
            </h3>
            <div style={{ display: "grid", gap: 8, color: "#334155", fontSize: "0.9rem", lineHeight: 1.5 }}>
              <div><strong>Thời gian:</strong> {selectedMeeting.duration_minutes || 0} phút</div>
              <div><strong>Ngày/giờ:</strong> {new Date(selectedMeeting.scheduled_at).toLocaleString("vi-VN")}</div>
              <div>
                <strong>Nhóm tham gia:</strong>{" "}
                {selectedMeeting.team_name || teamList.find((t) => Number(t.id) === Number(selectedMeeting.team_id))?.name || "Chưa gán nhóm"}
              </div>
              <div>
                <strong>Link họp:</strong>{" "}
                {selectedMeeting.meeting_url ? (
                  <a href={selectedMeeting.meeting_url} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                    {selectedMeeting.meeting_url}
                  </a>
                ) : (
                  "Chưa có"
                )}
              </div>
              {selectedMeeting.location && (
                <div><strong>Địa điểm:</strong> {selectedMeeting.location}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "meetings" && (
        <>
          {meetingList.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                ["all", "Tất cả", meetingList.length],
                ["upcoming", "Sắp tới", upcomingMeetings.length],
                ["past", "Đã qua", pastMeetings.length],
              ].map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  className={`btn ${meetingFilter === key ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setMeetingFilter(key)}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          )}

          {meetingList.length === 0 ? (
            <div className="card empty-state">
              <Icon name="CalendarToday" size={48} sx={{ opacity: 0.3 }} />
              <h3>Chưa có cuộc họp nào</h3>
            </div>
          ) : meetingFilter === "all" ? (
            <>
              {upcomingMeetings.length > 0 && (
                <section style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 12, color: "#15803d" }}>
                    Sắp tới ({upcomingMeetings.length})
                  </h3>
                  {upcomingMeetings.map((m) => (
                    <MeetingRow key={m.id} m={m} onSelect={() => setSelectedMeetingId(m.id)} />
                  ))}
                </section>
              )}
              {pastMeetings.length > 0 && (
                <section>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 12, color: "#64748b" }}>
                    Đã qua ({pastMeetings.length})
                  </h3>
                  {pastMeetings.map((m) => (
                    <MeetingRow key={m.id} m={m} onSelect={() => setSelectedMeetingId(m.id)} dimmed />
                  ))}
                </section>
              )}
            </>
          ) : filteredMeetings.length === 0 ? (
            <div className="card empty-state">
              <Icon name="CalendarToday" size={48} sx={{ opacity: 0.3 }} />
              <h3>Không có cuộc họp trong mục này</h3>
            </div>
          ) : (
            filteredMeetings.map((m) => (
              <MeetingRow
                key={m.id}
                m={m}
                onSelect={() => setSelectedMeetingId(m.id)}
                dimmed={m._timing?.bucket === "past"}
              />
            ))
          )}
        </>
      )}

      {tab === "requests" && (
        <>
          {requests.length === 0 ? (
            <div className="card empty-state"><Icon name="Group" size={48} sx={{ opacity: 0.3 }} /><h3>Không có yêu cầu nào</h3></div>
          ) : requests.map((r) => (
            <div key={r.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong>{r.title}</strong>
                  <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 4 }}>
                    Nhóm: {r.team_name} • {r.requester_name} • {new Date(r.proposed_at).toLocaleString("vi-VN")}
                  </div>
                  {r.reason && <p style={{ fontSize: "0.82rem", color: "#64748b" }}>{r.reason}</p>}
                </div>
                <span className={`badge ${r.status === "approved" ? "badge-success" : r.status === "declined" ? "badge-danger" : "badge-warning"}`}>
                  {r.status === "approved" ? "Chấp nhận" : r.status === "declined" ? "Từ chối" : "Chờ"}
                </span>
              </div>
              {r.status === "pending" && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="btn btn-success btn-sm" onClick={() => setApproveForm(approveForm === r.id ? null : r.id)}>
                    <Icon name="CheckCircle" size={14} /> Chấp nhận
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDecline(r.id)}>
                    <Icon name="Cancel" size={14} /> Từ chối
                  </button>
                </div>
              )}
              {approveForm === r.id && (
                <div style={{ marginTop: 12, padding: 12, background: "#f0fdf4", borderRadius: 8 }}>
                  <p style={{ fontSize: "0.82rem", marginBottom: 8 }}>Xác nhận tạo cuộc họp với thời gian đề xuất:</p>
                  <input type="datetime-local" className="form-input" defaultValue={r.proposed_at?.slice(0, 16)} style={{ marginBottom: 8 }}
                    onChange={(e) => setApproveData((d) => ({ ...d, [r.id]: { ...d[r.id], scheduled_at: e.target.value } }))} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(r.id)}>Xác nhận</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setApproveForm(null)}>Hủy</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
