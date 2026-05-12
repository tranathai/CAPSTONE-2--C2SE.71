import { useState, useEffect, useCallback } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { milestones, topics } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";
import { useSocket } from "../../context/SocketContext.jsx";
import "../student/Topic.css";

const PAGE_SIZE = 5;

function buildPageList(totalPages, current) {
  if (totalPages < 1) return [];
  if (totalPages === 1) return [1];
  const set = new Set([1, totalPages, current]);
  for (let d = -2; d <= 2; d += 1) {
    const p = current + d;
    if (p >= 1 && p <= totalPages) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("ellipsis");
    out.push(sorted[i]);
  }
  return out;
}

export default function MentorTopics() {
  const { toast, showToast } = useToast();
  const { on, off } = useSocket();
  const [pending, setPending] = useState([]);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [milestoneList, setMilestoneList] = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [approvingTopic, setApprovingTopic] = useState(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [batchQuery, setBatchQuery] = useState("");
  const [page, setPage] = useState(1);

  const refreshPending = useCallback(() => {
    topics.pending().then(setPending).catch(() => {});
  }, []);

  useEffect(() => {
    topics.pending().then(setPending).catch(() => {}).finally(() => setLoading(false));
    milestones.list().then(setMilestoneList).catch(() => {});
    milestones.batchList().then(setBatchList).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => refreshPending();
    on("topic_pending_refresh", handler);
    return () => off("topic_pending_refresh", handler);
  }, [on, off, refreshPending]);

  const handleApprove = async (id) => {
    try {
      const milestoneIds = [
        ...new Set(
          milestoneList
            .filter((m) => selectedBatchIds.includes(Number(m.graduation_batch_id)))
            .map((m) => Number(m.id))
            .filter((x) => x > 0),
        ),
      ];
      if (!milestoneIds.length) {
        showToast("Đợt đã chọn chưa có mốc nào. Hãy tạo milestone cho đợt đó trước.", "error");
        return;
      }
      await topics.approve(id, milestoneIds);
      showToast("Duyệt đề tài thành công!", "success");
      setPending((prev) => prev.filter((t) => t.id !== id));
      setApprovingTopic(null);
      setSelectedBatchIds([]);
      setBatchQuery("");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) { showToast("Lý do từ chối không được trống", "error"); return; }
    try {
      await topics.reject(id, rejectReason);
      showToast("Từ chối đề tài", "success");
      setPending((prev) => prev.filter((t) => t.id !== id));
      setRejectingId(null);
      setRejectReason("");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const totalPages = Math.max(1, Math.ceil(pending.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedPending = pending.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageItems = buildPageList(totalPages, safePage);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <h1>Duyệt đề tài</h1>
        <p>Xem và duyệt đề tài từ các nhóm sinh viên</p>
      </div>

      {pending.length === 0 ? (
        <div className="card empty-state">
          <Icon name="CheckCircle" size={48} sx={{ opacity: 0.3 }} />
          <h3>Không có đề tài chờ duyệt</h3>
          <p>Tất cả đề tài đã được xử lý</p>
        </div>
      ) : (
        pagedPending.map((t) => (
          <div key={t.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{t.title}</h3>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 4 }}>
                  Nhóm: {t.team_name} • <Icon name="Group" size={12} sx={{ marginRight: 3 }} /> {t.member_count} thành viên
                </div>
                {t.leader_name && <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Trưởng nhóm: {t.leader_name}</div>}
              </div>
              <span className="badge badge-warning"><Icon name="Schedule" size={12} /> Chờ duyệt</span>
            </div>

            {t.description && (
              <div style={{ marginBottom: 10, fontSize: "0.875rem", color: "#475569" }}>
                <strong>Mô tả:</strong> {t.description}
              </div>
            )}
            {t.technologies && (
              <div style={{ marginBottom: 10, fontSize: "0.875rem", color: "#475569" }}>
                <strong>Công nghệ:</strong> {t.technologies}
              </div>
            )}

            {rejectingId === t.id ? (
              <div style={{ marginTop: 12, padding: 12, background: "#fef2f2", borderRadius: 8 }}>
                <div className="form-group">
                  <label>Lý do từ chối *</label>
                  <textarea className="form-input" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do..." style={{ minHeight: 60 }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-danger btn-sm" onClick={() => handleReject(t.id)}>Xác nhận từ chối</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setRejectingId(null); setRejectReason(""); }}>Hủy</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => {
                    setApprovingTopic(t);
                    setSelectedBatchIds([]);
                    setBatchQuery("");
                  }}
                >
                  <Icon name="CheckCircle" size={14} /> Duyệt
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setRejectingId(t.id)}>
                  <Icon name="Cancel" size={14} /> Từ chối
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {pending.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <small style={{ color: "#64748b" }}>
            Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, pending.length)} / {pending.length} đề tài
            {" · "}
            <strong>Trang {safePage} / {totalPages}</strong>
          </small>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-sm btn-secondary" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              &lt;
            </button>
            {pageItems.map((item, idx) =>
              item === "ellipsis" ? (
                <span key={`ep-${idx}`} style={{ padding: "0 4px", color: "#94a3b8", userSelect: "none" }}>…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`btn btn-sm ${item === safePage ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              ),
            )}
            <button type="button" className="btn btn-sm btn-secondary" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              &gt;
            </button>
          </div>
        </div>
      )}

      {approvingTopic && (
        <div
          className="topic-modal-backdrop"
          role="presentation"
          onClick={() => {
            setApprovingTopic(null);
            setBatchQuery("");
          }}
        >
          <div className="topic-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="topic-modal-header">
              <h2 className="topic-modal-title">Chọn Đợt tốt nghiệp khi duyệt</h2>
              <button
                type="button"
                className="topic-modal-close"
                onClick={() => {
                  setApprovingTopic(null);
                  setBatchQuery("");
                }}
                aria-label="Đóng"
              >
                <Icon name="Close" size={20} />
              </button>
            </div>
            <div className="topic-modal-body">
              <p style={{ marginBottom: 10, color: "#475569", fontSize: "0.9rem" }}>
                Đề tài: <strong>{approvingTopic.title}</strong>
              </p>
              {batchList.length === 0 ? (
                <p style={{ color: "#b45309" }}>Chưa có Đợt tốt nghiệp nào. Hãy nhờ admin tạo trước.</p>
              ) : (
                <div className="form-group">
                  <label>Chọn các đợt áp dụng (hiển thị tối đa 5 đợt) *</label>
                  <input
                    className="form-input"
                    value={batchQuery}
                    onChange={(e) => setBatchQuery(e.target.value)}
                    placeholder="Tìm theo tên đợt..."
                    style={{ marginBottom: 10 }}
                  />
                  <div style={{ display: "grid", gap: 8 }}>
                    {batchList
                      .filter((b) => b.name?.toLowerCase().includes(batchQuery.trim().toLowerCase()))
                      .slice(0, 5)
                      .map((b) => {
                      const checked = selectedBatchIds.includes(Number(b.id));
                      return (
                        <label key={b.id} style={{ display: "flex", gap: 8, alignItems: "center", margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setSelectedBatchIds((prev) =>
                                e.target.checked ? [...prev, Number(b.id)] : prev.filter((id) => id !== Number(b.id)),
                              );
                            }}
                          />
                          <span>{b.name}</span>
                        </label>
                      );
                    })}
                    {batchList.filter((b) => b.name?.toLowerCase().includes(batchQuery.trim().toLowerCase())).length === 0 && (
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
                        Không tìm thấy đợt phù hợp.
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="topic-modal-actions">
                <button
                  className="btn btn-success"
                  disabled={selectedBatchIds.length === 0}
                  onClick={() => handleApprove(approvingTopic.id)}
                >
                  Xác nhận duyệt
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setApprovingTopic(null);
                    setBatchQuery("");
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
