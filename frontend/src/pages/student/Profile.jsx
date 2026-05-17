import { useState, useEffect } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { users } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../hooks/useToast.js";

const EMPTY_PASSWORD_FORM = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

function validatePasswordForm(form) {
  const errors = {};
  if (!form.current_password.trim()) {
    errors.current_password = "Vui lòng nhập mật khẩu hiện tại";
  }
  if (!form.new_password.trim()) {
    errors.new_password = "Vui lòng nhập mật khẩu mới";
  } else {
    const p = form.new_password;
    if (p.length < 6 || !/[A-Z]/.test(p) || !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)) {
      errors.new_password = "Tối thiểu 6 ký tự, gồm chữ in hoa và ký tự đặc biệt";
    }
  }
  if (!form.confirm_password.trim()) {
    errors.confirm_password = "Vui lòng nhập lại mật khẩu mới";
  } else if (form.new_password !== form.confirm_password) {
    errors.confirm_password = "Mật khẩu xác nhận không khớp";
  }
  return errors;
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="form-field-error" role="alert">
      {message}
    </p>
  );
}

export default function StudentProfile() {
  const { user, setUser } = useAuth();
  const { toast, showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

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
      showToast(err.response?.data?.message || err.message || "Lưu thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  const closePasswordModal = () => {
    if (changingPassword) return;
    setShowPasswordModal(false);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordErrors({});
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errors = validatePasswordForm(passwordForm);
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setPasswordErrors({});
    setChangingPassword(true);
    try {
      await users.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      });
      showToast("Đổi mật khẩu thành công!", "success");
      closePasswordModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Đổi mật khẩu thất bại";
      showToast(msg, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const clearPwError = (field) => {
    setPasswordErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Icon name="Save" size={16} /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPasswordModal(true)}
            >
              <Icon name="Lock" size={16} /> Đổi mật khẩu
            </button>
          </div>
        </form>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay" role="presentation" onClick={changingPassword ? undefined : closePasswordModal}>
          <div
            className="modal"
            style={{ maxWidth: 440 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="change-password-title" style={{ marginBottom: 16 }}>Đổi mật khẩu</h3>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label htmlFor="current_password">Mật khẩu hiện tại</label>
                <div className="password-wrap">
                  <input
                    id="current_password"
                    type={showCurrentPw ? "text" : "password"}
                    className={`form-input${passwordErrors.current_password ? " form-input--invalid" : ""}`}
                    value={passwordForm.current_password}
                    onChange={(e) => {
                      clearPwError("current_password");
                      setPasswordForm((f) => ({ ...f, current_password: e.target.value }));
                    }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowCurrentPw((v) => !v)}
                    aria-label={showCurrentPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <Icon name={showCurrentPw ? "VisibilityOff" : "Visibility"} size={18} />
                  </button>
                </div>
                <FieldError message={passwordErrors.current_password} />
              </div>
              <div className="form-group">
                <label htmlFor="new_password">Mật khẩu mới</label>
                <div className="password-wrap">
                  <input
                    id="new_password"
                    type={showNewPw ? "text" : "password"}
                    className={`form-input${passwordErrors.new_password ? " form-input--invalid" : ""}`}
                    value={passwordForm.new_password}
                    onChange={(e) => {
                      clearPwError("new_password");
                      setPasswordForm((f) => ({ ...f, new_password: e.target.value }));
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowNewPw((v) => !v)}
                    aria-label={showNewPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <Icon name={showNewPw ? "VisibilityOff" : "Visibility"} size={18} />
                  </button>
                </div>
                <FieldError message={passwordErrors.new_password} />
              </div>
              <div className="form-group">
                <label htmlFor="confirm_password">Nhập lại mật khẩu mới</label>
                <div className="password-wrap">
                  <input
                    id="confirm_password"
                    type={showConfirmPw ? "text" : "password"}
                    className={`form-input${passwordErrors.confirm_password ? " form-input--invalid" : ""}`}
                    value={passwordForm.confirm_password}
                    onChange={(e) => {
                      clearPwError("confirm_password");
                      setPasswordForm((f) => ({ ...f, confirm_password: e.target.value }));
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    aria-label={showConfirmPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <Icon name={showConfirmPw ? "VisibilityOff" : "Visibility"} size={18} />
                  </button>
                </div>
                <FieldError message={passwordErrors.confirm_password} />
              </div>
              <div className="modal-actions" style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" disabled={changingPassword} onClick={closePasswordModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={changingPassword}>
                  {changingPassword ? "Đang lưu..." : "Lưu mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
