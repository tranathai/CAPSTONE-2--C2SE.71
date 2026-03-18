import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { role } = useParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@(gmail\.com|gmail\.edu\.vn)$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // Kiểm tra tất cả điều kiện một lần
    const hasMinLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasMinLength || !hasUpperCase || !hasSpecialChar) {
      return { valid: false, message: 'Mật khẩu tối thiểu 6 ký tự bao gồm chữ in hoa và ký tự đặc biệt' };
    }
    return { valid: true };
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate email format
    if (!validateEmail(formData.email)) {
      setError('Gmail không đúng định dạng vui lòng nhập lại');
      setLoading(false);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message);
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/register', {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    return role === 'student' ? 'Sinh viên' : 'Giảng viên';
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <div className="logo">
          <span className="logo-icon">🏠</span>
          <span className="logo-text">MentorAI Grad</span>
        </div>
        <div className="header-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#support">Support</a>
          <Link to={`/login/${role}`}>
            <button className="login-btn">Login</button>
          </Link>
        </div>
      </div>

      <div className="register-content">
        <div className="register-box">
          <div className="lock-icon">✏️</div>
          <h1>Create Account</h1>
          <p className="subtitle">Đăng ký tài khoản {getRoleTitle()}</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">
                <span className="icon">👤</span> Họ và tên
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <span className="icon">@</span> Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="name@gmail.com hoặc name@gmail.edu.vn"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <small className="input-hint">Email phải có đuôi @gmail.com hoặc @gmail.edu.vn</small>
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <span className="icon">🔑</span> Password
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <small className="input-hint">
                Mật khẩu tối thiểu 6 ký tự bao gồm chữ in hoa và ký tự đặc biệt
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <span className="icon">🔑</span> Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="register-submit-btn" disabled={loading}>
              {loading ? 'Đang đăng ký...' : 'Register →'}
            </button>
          </form>

          <div className="login-link">
            Already have an account? <Link to={`/login/${role}`}>Sign in</Link>
          </div>

          <div className="back-link">
            <Link to="/">← Quay lại chọn vai trò</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
