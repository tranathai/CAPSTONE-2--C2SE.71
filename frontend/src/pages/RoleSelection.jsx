import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RoleSelection.css';

const RoleSelection = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    navigate(`/login/${role}`);
  };

  return (
    <div className="role-selection-container">
      <div className="role-selection-header">
        <div className="logo">
          <span className="logo-icon">🏠</span>
          <span className="logo-text">MentorAI Grad</span>
        </div>
        <div className="header-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#support">Support</a>
        </div>
      </div>

      <div className="role-selection-content">
        <div className="role-selection-box">
          <div className="lock-icon">🔒</div>
          <h1>Chào mừng đến với MentorAI Grad</h1>
          <p className="subtitle">Vui lòng chọn vai trò của bạn để tiếp tục</p>

          <div className="role-cards">
            <div className="role-card" onClick={() => handleRoleSelect('student')}>
              <div className="role-icon student-icon">🎓</div>
              <h3>Sinh viên</h3>
              <p>Đăng nhập với tư cách sinh viên</p>
              <button className="role-button student-button">
                Chọn vai trò
              </button>
            </div>

            <div className="role-card" onClick={() => handleRoleSelect('teacher')}>
              <div className="role-icon teacher-icon">👨‍🏫</div>
              <h3>Giảng viên</h3>
              <p>Đăng nhập với tư cách giảng viên</p>
              <button className="role-button teacher-button">
                Chọn vai trò
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
