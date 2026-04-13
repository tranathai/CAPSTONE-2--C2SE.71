import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { role } = useParams();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getApiErrorMessage = (err) => {
    if (!err.response) {
      return 'Không thể kết nối backend. Hãy chạy backend ở cổng 5000.';
    }

    // Proxy lỗi: response là HTML (backend không chạy)
    if (typeof err.response.data === 'string') {
      return 'Không thể kết nối backend. Hãy chạy backend ở cổng 5000.';
    }

    if (err.response?.data?.message) {
      return err.response.data.message;
    }

    // Lỗi validation từ express-validator (trả về mảng errors)
    if (err.response?.data?.errors?.length > 0) {
      return err.response.data.errors[0].msg;
    }

    if (err.response.status >= 500) {
      return 'Backend đang lỗi (500). Vui lòng kiểm tra terminal backend.';
    }

    return 'Đã có lỗi xảy ra';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@(gmail\.com|gmail\.edu\.vn)$/;
    return emailRegex.test(email);
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

    try {
      const response = await axios.post('/api/auth/login', {
        ...formData,
        role
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    return role === 'student' ? 'Sinh viên' : 'Giảng viên';
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="logo">
          <span className="logo-icon">🏠</span>
          <span className="logo-text">MentorAI Grad</span>
        </div>
        <div className="header-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#support">Support</a>
          <Link to={`/register/${role}`}>
            <button className="register-btn">Register</button>
          </Link>
        </div>
      </div>

      <div className="login-content">
        <div className="login-box">
          <div className="lock-icon">🔒</div>
          <h1>Welcome Back</h1>
          <p className="subtitle">Đăng nhập với tư cách {getRoleTitle()}</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">
                <span className="icon">@</span> Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="name@university.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
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
            </div>

            <div className="form-footer">
              <a href="#forgot" className="forgot-password">Forgot password?</a>
            </div>

            <button type="submit" className="signin-btn" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Sign In →'}
            </button>
          </form>

          <div className="signup-link">
            Don't have an account? <Link to={`/register/${role}`}>Register now</Link>
          </div>

          <div className="back-link">
            <Link to="/">← Quay lại chọn vai trò</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
