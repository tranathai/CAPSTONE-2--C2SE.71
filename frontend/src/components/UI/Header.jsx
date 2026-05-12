import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { notifications } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifList, setNotifList] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    
    // Fetch notification count khi component mount hoặc user.id thay đổi
    notifications.unreadCount()
      .then((d) => setNotifCount(d?.count || 0))
      .catch(() => {});
    
    // Chỉ poll mỗi 30 giây, không fetch lại khi user object thay đổi
    const interval = setInterval(() => {
      notifications.unreadCount()
        .then((d) => setNotifCount(d?.count || 0))
        .catch(() => {});
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]); // Chỉ depend trên user.id, không phải toàn bộ user object

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadNotifications = async () => {
    if (showNotifs) { setShowNotifs(false); return; }
    try {
      const data = await notifications.list({ limit: 20 });
      setNotifList(data);
    } catch {}
    setShowNotifs((v) => !v);
  };

  const markRead = async (id) => {
    await notifications.markRead(id).catch(() => {});
    setNotifList((prev) => prev.map((n) => n.id === id ? { ...n, is_read: 1 } : n));
    setNotifCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notifications.markAllRead().catch(() => {});
    setNotifCount(0);
    setNotifList((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  const roleLabel = user?.role === "admin" ? "Quản trị viên"
    : user?.role === "supervisor" ? "Giảng viên" : "Sinh viên";

  const msgPath = user?.role === "admin" ? "/admin/messages"
    : user?.role === "supervisor" ? "/supervisor/messages"
    : "/student/messages";

  return (
    <header className="top-header">
      <div className="header-search">
        <Icon name="Search" size={18} sx={{ color: "#94a3b8" }} />
        <input placeholder="Tìm kiếm..." className="header-search-input" />
      </div>
      <div className="header-actions">
        <button className="header-icon-btn" onClick={() => navigate(msgPath)} title="Tin nhắn">
          <Icon name="Chat" size={20} />
        </button>
        <div className="notif-wrapper" ref={notifRef}>
          <button className="header-icon-btn" onClick={loadNotifications} title="Thông báo">
            <Icon name="Notifications" size={20} />
            {notifCount > 0 && <span className="notif-badge">{notifCount > 99 ? "99+" : notifCount}</span>}
          </button>
          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Thông báo</span>
                {notifCount > 0 && (
                  <button className="btn btn-sm btn-secondary" onClick={markAllRead}>
                    Đọc tất cả
                  </button>
                )}
              </div>
              <div className="notif-body">
                {notifList.length === 0 ? (
                  <div className="notif-empty">
                    <Icon name="Notifications" size={32} sx={{ opacity: 0.3 }} />
                    <p>Không có thông báo</p>
                  </div>
                ) : (
                  notifList.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${n.is_read ? "" : "unread"}`}
                      onClick={() => {
                        if (!n.is_read) markRead(n.id);
                        if (n.related_url) navigate(n.related_url);
                        setShowNotifs(false);
                      }}
                    >
                      <div className="notif-icon-wrap">
                        <Icon
                          name={n.type === "feedback" ? "Feedback" : n.type === "meeting" ? "Calendar" : n.type === "deadline" ? "Warning" : "Notifications"}
                          size={16}
                          sx={{ color: n.is_read ? "#94a3b8" : "#3b82f6" }}
                        />
                      </div>
                      <div className="notif-content">
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-msg">{n.message}</div>
                        <div className="notif-time">{timeAgo(n.created_at)}</div>
                      </div>
                      {!n.is_read && <div className="notif-dot" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="header-user">
          <div className="header-avatar" style={{ background: roleColor(user?.role) }}>
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div className="header-user-info">
            <div className="header-user-name">{user?.full_name}</div>
            <div className="header-user-role">{roleLabel}</div>
          </div>
          <button className="header-icon-btn danger" onClick={logout} title="Đăng xuất">
            <Icon name="LogOut" size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

function roleColor(role) {
  if (role === "admin") return "linear-gradient(135deg, #dc2626, #991b1b)";
  if (role === "supervisor") return "linear-gradient(135deg, #059669, #047857)";
  return "linear-gradient(135deg, #3b82f6, #1d4ed8)";
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}
