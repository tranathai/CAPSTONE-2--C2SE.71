import { useCallback, useState } from "react";
import { getTeamMessages, sendTeamMessage } from "../../../lib/api";
import { useAsyncResource } from "../../../hooks/useAsyncResource";

function TeamChatBox({ teamId }) {
  const [message, setMessage] = useState("");
  const loadMessages = useCallback(async () => {
    if (!teamId) return { conversationId: null, messages: [] };
    return getTeamMessages(teamId);
  }, [teamId]);
  const { data, loading, error, reload } = useAsyncResource(loadMessages);
  const messages = data?.messages || [];

  const handleSend = async (event) => {
    event.preventDefault();
    if (!teamId || !message.trim()) return;
    await sendTeamMessage(teamId, message.trim());
    setMessage("");
    await reload();
  };

  return (
    <div className="upload-card">
      <h3 className="section-title">Team Chat</h3>
      {loading ? <div className="page-muted">Dang tai tin nhan...</div> : null}
      {error ? <div className="form-error">{error}</div> : null}
      <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
        {messages.length === 0 ? (
          <div className="page-muted">Chua co tin nhan.</div>
        ) : (
          messages.map((item) => (
            <div key={item.id} style={{ marginBottom: 10 }}>
              <strong>{item.sender_name}</strong>
              <div>{item.body}</div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSend} className="feedback-form">
        <textarea
          className="mentor-feedback-textarea"
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Nhap tin nhan..."
        />
        <button className="btn-primary" type="submit">Gui tin nhan</button>
      </form>
    </div>
  );
}

export default TeamChatBox;
