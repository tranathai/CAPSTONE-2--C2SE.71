import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { auth } from "../lib/api.js";
import Icon from "../components/UI/Icon.jsx";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await auth.login(email.trim(), password);
      login(res.token, res.user);
      const role = res.user.role;
      if (role === "admin") navigate("/admin/dashboard", { replace: true });
      else if (role === "supervisor") navigate("/supervisor/dashboard", { replace: true });
      else navigate("/student/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        err.message ||
        "Đăng nhập thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <h1 className="brand-name">MentorAI Grad</h1>
        <p className="brand-tagline">Hệ thống quản lý đồ án capstone</p>
      </div>

      <div className="login-card">
        <div className="login-card-header">
          <div className="login-icon"><Icon name="School" size={48} sx={{ color: "#1e40af" }} /></div>
          <h2>Đăng nhập</h2>
          <p>Nhập email và mật khẩu được cấp bởi quản trị viên</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@domain.com"
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Mật khẩu</label>
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
              />
              <button type="button" className="toggle-pw" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <Icon name="VisibilityOff" size={18} /> : <Icon name="Visibility" size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập →"}
          </button>
        </form>
      </div>
    </div>
  );
}
