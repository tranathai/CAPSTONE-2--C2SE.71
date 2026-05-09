import { useState, useEffect } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { users } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../hooks/useToast.js";

export default function StudentProfile() {
  const { user, setUser } = useAuth();
  const { toast, showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    users.me().then((p) => {
      setProfile(p);
      setForm({ full_name: p.full_name || "", phone: p.phone || "" });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await users.updateProfile(form);
      showToast("Cập nhật hồ sơ thành công!", "success");
      setUser({ ...user, full_name: form.full_name, phone: form.phone });
    } catch (err) {
      showToast(err.message || "Lưu thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <h1>Hồ sơ cá nhân</h1>
        <p>Quản lý thông tin cá nhân của bạn</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, background: "#3b82f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.8rem" }}>
            {profile?.full_name?.charAt(0) || "?"}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>{profile?.full_name}</div>
            <div style={{ color: "#64748b", fontSize: "0.875rem" }}>{profile?.email}</div>
            <span className="badge badge-info">Sinh viên</span>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Họ và tên</label>
            <input className="form-input" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" value={profile?.email || ""} disabled />
          </div>
          <div className="form-group">
            <label>Số điện thoại</label>
            <input className="form-input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="0xx xxx xxxx" />
          </div>
          {profile?.student_code && (
            <div className="form-group">
              <label>Mã sinh viên</label>
              <input className="form-input" value={profile.student_code} disabled />
            </div>
          )}
          {profile?.class_name && (
            <div className="form-group">
              <label>Lớp</label>
              <input className="form-input" value={profile.class_name} disabled />
            </div>
          )}
          {profile?.major && (
            <div className="form-group">
              <label>Chuyên ngành</label>
              <input className="form-input" value={profile.major} disabled />
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Icon name="Save" size={16} /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      </div>
    </div>
  );
}
