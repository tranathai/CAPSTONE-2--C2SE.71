import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../../components/UI/Icon.jsx";
import { messages } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../hooks/useToast.js";

export default function MentorMessages() {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("team");
  const { user } = useAuth();
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    messages.groups().then(setGroups).catch(() => {});
  }, []);

  useEffect(() => {
    if (!teamId) return;
    messages.groupMessages(Number(teamId)).then(setConversation).catch(() => {});
    const interval = setInterval(async () => {
      const msgs = await messages.groupMessages(Number(teamId)).catch(() => []);
      setConversation(msgs);
    }, 5000);
    return () => clearInterval(interval);
  }, [teamId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !teamId) return;
    setSending(true);
    try {
      await messages.sendGroup({ team_id: Number(teamId), content: text.trim() });
      setText("");
      const msgs = await messages.groupMessages(Number(teamId));
      setConversation(msgs);
      const gl = await messages.groups();
      setGroups(gl);
    } catch { showToast("Gửi thất bại", "error"); }
    finally { setSending(false); }
  };

  const selectedGroup = groups.find((g) => g.id === Number(teamId));

  return (
    <div className="page-container" style={{ height: "calc(100vh - 120px)", display: "flex", gap: 16, padding: 0 }}>
      <div style={{ width: 280, borderRight: "1px solid #e2e8f0", padding: "20px 12px", overflowY: "auto" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16, padding: "0 4px" }}>Tin nhắn nhóm</h2>
        {groups.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center", padding: 20 }}>Chưa có nhóm nào</p>
        ) : (
          groups.map((g) => (
            <div key={g.id} onClick={() => { window.location.href = `/supervisor/messages?team=${g.id}`; }}
              style={{ display: "flex", gap: 10, padding: 10, borderRadius: 8, marginBottom: 4, cursor: "pointer", background: Number(teamId) === g.id ? "#eff6ff" : "transparent" }}>
              <div style={{ width: 40, height: 40, background: "#10b981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                <Icon name="Group" size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{g.name}</span>
                  {g.unread_count > 0 && <span style={{ background: "#dc2626", color: "#fff", fontSize: "0.65rem", width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{g.unread_count}</span>}
                </div>
                <p style={{ fontSize: "0.78rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.last_message || "Chưa có tin nhắn"}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!teamId ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
            <div style={{ textAlign: "center" }}>
              <Icon name="Chat" size={48} sx={{ opacity: 0.3, marginBottom: 12 }} />
              <p>Chọn nhóm để nhắn tin</p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: 600 }}>
              {selectedGroup?.name || "Nhóm chat"}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {conversation.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 12 }}>
                    <div style={{ maxWidth: "70%", background: isMe ? "#10b981" : "#f1f5f9", color: isMe ? "#fff" : "#1e293b", borderRadius: 12, padding: "10px 14px", fontSize: "0.875rem" }}>
                      {!isMe && (
                        <div style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: 4, fontWeight: 600 }}>
                          {msg.sender_name}
                        </div>
                      )}
                      <p style={{ margin: 0, lineHeight: 1.5 }}>{msg.content}</p>
                      <div style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: 4, textAlign: "right" }}>{new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 8 }}>
              <input className="form-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhập tin nhắn..." style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}><Icon name="Send" size={16} /></button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
