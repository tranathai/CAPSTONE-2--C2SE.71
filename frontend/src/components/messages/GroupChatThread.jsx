import { useState, useEffect, useRef } from "react";
import Icon from "../UI/Icon.jsx";
import { messages } from "../../lib/api.js";
import {
  canModifyGroupMessage,
  GROUP_MESSAGE_EDIT_EXPIRED_MESSAGE,
} from "../../lib/groupMessageWindow.js";

export default function GroupChatThread({
  conversation,
  user,
  meBubbleColor = "#1e40af",
  onReload,
  showToast,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!openMenuId) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenuId]);

  const handleEdit = async (msg) => {
    setOpenMenuId(null);
    if (!canModifyGroupMessage(msg.created_at)) {
      showToast?.(GROUP_MESSAGE_EDIT_EXPIRED_MESSAGE, "error");
      return;
    }
    const next = window.prompt("Chỉnh sửa tin nhắn:", msg.content);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed) {
      showToast?.("Nội dung không được để trống", "error");
      return;
    }
    if (trimmed === msg.content) return;
    try {
      await messages.updateGroupMessage(msg.id, { content: trimmed });
      await onReload?.();
    } catch {
      showToast?.("Chỉnh sửa thất bại", "error");
    }
  };

  const handleDelete = async (msg) => {
    setOpenMenuId(null);
    if (!canModifyGroupMessage(msg.created_at)) {
      showToast?.(GROUP_MESSAGE_EDIT_EXPIRED_MESSAGE, "error");
      return;
    }
    if (!window.confirm("Xóa tin nhắn này? Thành viên nhóm sẽ thấy thông báo.")) return;
    try {
      await messages.deleteGroupMessage(msg.id);
      await onReload?.();
    } catch {
      showToast?.("Xóa thất bại", "error");
    }
  };

  return (
    <>
      {conversation.map((msg) => {
        const isSystem = msg.message_kind === "system";
        if (isSystem) {
          return (
            <div key={msg.id} style={{ textAlign: "center", marginBottom: 12 }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>{msg.content}</span>
            </div>
          );
        }

        const isMe = msg.sender_id === user?.id;
        const isDeleted = Boolean(msg.is_deleted);
        const canManage = isMe && !isDeleted && canModifyGroupMessage(msg.created_at);
        const edited = msg.updated_at && msg.updated_at !== msg.created_at;

        return (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: isMe ? "flex-end" : "flex-start",
              alignItems: "flex-start",
              gap: 4,
              marginBottom: 12,
            }}
          >
            {canManage && (
              <div ref={openMenuId === msg.id ? menuRef : null} style={{ position: "relative", flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                  aria-label="Tùy chọn tin nhắn"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Icon name="MoreVert" size={18} />
                </button>
                {openMenuId === msg.id && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      marginTop: 4,
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      zIndex: 10,
                      minWidth: 140,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleEdit(msg)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 14px",
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(msg)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 14px",
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        color: "#dc2626",
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            )}
            <div
              style={{
                maxWidth: "70%",
                background: isMe ? meBubbleColor : "#f1f5f9",
                color: isMe ? "#fff" : "#1e293b",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: "0.875rem",
                opacity: isDeleted ? 0.75 : 1,
              }}
            >
              {!isMe && (
                <div style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: 4, fontWeight: 600 }}>
                  {msg.sender_name}
                </div>
              )}
              <p style={{ margin: 0, lineHeight: 1.5, fontStyle: isDeleted ? "italic" : "normal" }}>
                {isDeleted ? "Tin nhắn đã bị xóa" : msg.content}
              </p>
              <div style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: 4, textAlign: "right" }}>
                {new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                {edited && !isDeleted && <span style={{ marginLeft: 6 }}>(đã chỉnh sửa)</span>}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
