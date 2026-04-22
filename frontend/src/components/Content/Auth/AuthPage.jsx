import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register, resendOtp, verifyOtp } from "../../../lib/api";
import { setRuntimeRole } from "../../../config/runtimeRole";
import "../../../styles/auth.css";

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState("credentials");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const [pendingToken, setPendingToken] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submitCredentials = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = mode === "login" ? await login(form) : await register(form);
      setPendingToken(response.pendingToken);
      setDevOtp(response.devOtp || "");
      setOtpCode("");
      setStep("otp");
      setSuccess("OTP da duoc gui toi email cua ban.");
    } catch (apiError) {
      setError(apiError.message || "Khong the xac thuc");
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await verifyOtp({ pendingToken, otpCode });
      localStorage.setItem("access_token", response.token);
      localStorage.setItem("refresh_token", response.refreshToken || "");
      setRuntimeRole(response.user.role);
      if (response.user.role === "admin") navigate("/admin/users");
      else if (response.user.role === "supervisor") navigate("/mentor/submissions");
      else navigate("/student/dashboard");
    } catch (apiError) {
      setError(apiError.message || "Xac thuc OTP that bai");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    try {
      const response = await resendOtp(pendingToken);
      setPendingToken(response.pendingToken);
      setDevOtp(response.devOtp || "");
      setSuccess("Da gui lai OTP.");
    } catch (apiError) {
      setError(apiError.message || "Khong the gui lai OTP");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">MentorAI Grad</h1>
        <p className="auth-subtitle">
          {mode === "login" ? "Dang nhap he thong" : "Tao tai khoan moi"}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Dang nhap
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
          >
            Dang ky
          </button>
        </div>

        {step === "credentials" ? (
          <form onSubmit={submitCredentials} className="auth-form">
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
                required
              />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))}
                required
              />
            </label>
            {error ? <div className="form-error">{error}</div> : null}
            {success ? <div className="form-success">{success}</div> : null}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Dang xu ly..." : mode === "login" ? "Dang nhap" : "Dang ky"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="auth-form">
            <label className="auth-field">
              <span>Nhap OTP (6 so)</span>
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                minLength={6}
                maxLength={6}
                inputMode="numeric"
                required
              />
            </label>
            {devOtp ? (
              <div className="form-success">Dev OTP: {devOtp}</div>
            ) : null}
            {error ? <div className="form-error">{error}</div> : null}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Dang xac thuc..." : "Xac thuc OTP"}
            </button>
            <button className="auth-tab" type="button" onClick={handleResendOtp}>
              Gui lai OTP
            </button>
            <button className="auth-tab" type="button" onClick={() => setStep("credentials")}>
              Quay lai
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthPage;
