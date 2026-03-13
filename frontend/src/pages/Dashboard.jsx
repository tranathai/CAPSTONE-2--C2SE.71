import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// Profile Content Component
const ProfileContent = ({ user, handleLogout }) => {
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    dateOfBirth: '',
    studentId: '',
    address: '',
    gender: '',
    avatar: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    // TODO: Lưu dữ liệu lên server
    console.log('Saving profile:', profileData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset về dữ liệu ban đầu
    setProfileData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: '',
      dateOfBirth: '',
      studentId: '',
      address: '',
      gender: '',
      avatar: ''
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-content">
      <div className="profile-header">
        <h1>Hồ sơ cá nhân</h1>
        <div className="profile-actions">
          {isEditing && (
            <button 
              className="cancel-btn"
              onClick={handleCancel}
            >
              ✕ Hủy
            </button>
          )}
          <button 
            className="edit-profile-btn"
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            {isEditing ? '💾 Lưu' : '✏️ Chỉnh sửa'}
          </button>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="avatar-container">
            {profileData.avatar ? (
              <img src={profileData.avatar} alt="Avatar" className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                {user?.fullName?.charAt(0).toUpperCase() || '👤'}
              </div>
            )}
          </div>
          {isEditing && (
            <button className="change-avatar-btn">
              📷 Thay đổi ảnh
            </button>
          )}
        </div>

        <div className="profile-form">
          <div className="form-row">
            <div className="form-field">
              <label>
                Họ và tên <span className="editable-mark">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={profileData.fullName}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Nhập họ và tên"
                className={!isEditing ? 'disabled' : ''}
              />
            </div>
            <div className="form-field">
              <label>
                Email <span className="readonly-mark">(Không thể thay đổi)</span>
              </label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                disabled
                className="disabled"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>
                Số điện thoại <span className="editable-mark">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Nhập số điện thoại"
                className={!isEditing ? 'disabled' : ''}
              />
            </div>
            <div className="form-field">
              <label>
                Ngày tháng năm sinh <span className="editable-mark">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={profileData.dateOfBirth}
                onChange={handleChange}
                disabled={!isEditing}
                className={!isEditing ? 'disabled' : ''}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>
                {user?.role === 'student' ? 'Mã số sinh viên' : 'Mã giảng viên'} 
                <span className="readonly-mark"> (Không thể thay đổi)</span>
              </label>
              <input
                type="text"
                name="studentId"
                value={profileData.studentId}
                placeholder={user?.role === 'student' ? 'Chưa cập nhật mã số sinh viên' : 'Chưa cập nhật mã giảng viên'}
                disabled
                className="disabled"
              />
            </div>
            <div className="form-field">
              <label>
                Giới tính <span className="editable-mark">*</span>
              </label>
              <select
                name="gender"
                value={profileData.gender}
                onChange={handleChange}
                disabled={!isEditing}
                className={!isEditing ? 'disabled' : ''}
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>
                Vai trò <span className="readonly-mark">(Không thể thay đổi)</span>
              </label>
              <input
                type="text"
                value={user?.role === 'student' ? 'Sinh viên' : 'Giảng viên'}
                disabled
                className="disabled"
              />
            </div>
            <div className="form-field">
              <label>
                Địa chỉ <span className="editable-mark">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={profileData.address}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Nhập địa chỉ"
                className={!isEditing ? 'disabled' : ''}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="profile-info-card">
        <h2>Thông tin tài khoản</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon">🆔</span>
            <div className="info-details">
              <span className="info-label">ID tài khoản</span>
              <span className="info-value">{user?.id}</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📧</span>
            <div className="info-details">
              <span className="info-label">Trạng thái email</span>
              <span className="info-value verified">✓ Đã xác thực</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📅</span>
            <div className="info-details">
              <span className="info-label">Ngày tạo</span>
              <span className="info-value">Mới tạo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="logout-section">
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </div>

      {isEditing && (
        <div className="profile-note">
          <p>📝 <strong>Lưu ý:</strong> Các trường có dấu <span className="editable-mark">*</span> có thể chỉnh sửa. Các trường có ghi chú <span className="readonly-mark">(Không thể thay đổi)</span> không thể chỉnh sửa.</p>
        </div>
      )}
    </div>
  );
};

// Dashboard Content Component
const DashboardContent = ({ user }) => {
  return (
    <>
      <div className="content-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="subtitle">Welcome back, {user?.fullName?.split(' ')[0] || 'Alex'}. Your project is on track.</p>
        </div>
        <button className="submit-update-btn">+ Submit Update</button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Project Status</span>
            <span className="stat-icon success">✓</span>
          </div>
          <div className="stat-value">Approved</div>
          <div className="stat-footer">
            <span className="badge success">✓ Fully validated</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Overall Progress</span>
            <span className="stat-icon">📈</span>
          </div>
          <div className="stat-value">75%</div>
          <div className="stat-footer">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Next Deadline</span>
            <span className="stat-icon warning">📅</span>
          </div>
          <div className="stat-value">Oct 20</div>
          <div className="stat-footer">
            <span className="badge">Final Draft Submission</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Latest Feedback</span>
            <span className="stat-icon">💬</span>
          </div>
          <div className="stat-value">Review Received</div>
          <div className="stat-footer">
            <span className="feedback-text">Dr. Sarah Smith • 2h ago</span>
          </div>
        </div>
      </div>

      {/* Project Roadmap */}
      <div className="section-card">
        <div className="section-header">
          <h2>Project Roadmap</h2>
          <a href="#" className="view-details">View All Details</a>
        </div>
        <div className="roadmap">
          <div className="roadmap-step completed">
            <div className="step-icon">✓</div>
            <div className="step-info">
              <div className="step-title">Proposal</div>
              <div className="step-date">Completed Sep 05</div>
            </div>
          </div>
          <div className="roadmap-connector completed"></div>
          
          <div className="roadmap-step completed">
            <div className="step-icon">✓</div>
            <div className="step-info">
              <div className="step-title">Research</div>
              <div className="step-date">Completed Sep 28</div>
            </div>
          </div>
          <div className="roadmap-connector active"></div>
          
          <div className="roadmap-step active">
            <div className="step-icon">▶</div>
            <div className="step-info">
              <div className="step-title">Development</div>
              <div className="step-date">In Progress</div>
            </div>
          </div>
          <div className="roadmap-connector"></div>
          
          <div className="roadmap-step">
            <div className="step-icon">⏱️</div>
            <div className="step-info">
              <div className="step-title">Final Draft</div>
              <div className="step-date">Target Oct 20</div>
            </div>
          </div>
          <div className="roadmap-connector"></div>
          
          <div className="roadmap-step">
            <div className="step-icon">🎯</div>
            <div className="step-info">
              <div className="step-title">Defense</div>
              <div className="step-date">Target Nov 15</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="section-card">
        <div className="section-header">
          <h2>Recent Submissions</h2>
          <span className="time-badge">Past 30 days</span>
        </div>
        <div className="submissions-list">
          <div className="submission-item">
            <div className="submission-icon">📄</div>
            <div className="submission-info">
              <div className="submission-name">Literature_Review_v2.pdf</div>
              <div className="submission-meta">Submitted Oct 02 • 4.2 MB</div>
            </div>
            <div className="submission-status accepted">ACCEPTED</div>
          </div>
          
          <div className="submission-item">
            <div className="submission-icon">💻</div>
            <div className="submission-info">
              <div className="submission-name">Initial_Prototype_Source.zip</div>
              <div className="submission-meta">Submitted Sep 24 • 12.8 MB</div>
            </div>
            <div className="submission-status reviewed">REVIEWED</div>
          </div>
        </div>
      </div>
    </>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/');
      return;
    }

    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const renderContent = () => {
    switch (activeMenuItem) {
      case 'profile':
        return <ProfileContent user={user} handleLogout={handleLogout} />;
      case 'dashboard':
      default:
        return <DashboardContent user={user} />;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🎓</span>
            <span className="logo-text">MentorAI Grad</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeMenuItem === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenuItem('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </div>
          <div 
            className={`nav-item ${activeMenuItem === 'project' ? 'active' : ''}`}
            onClick={() => setActiveMenuItem('project')}
          >
            <span className="nav-icon">📁</span>
            <span className="nav-text">My Project</span>
          </div>
          <div 
            className={`nav-item ${activeMenuItem === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveMenuItem('reports')}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Reports</span>
          </div>
          <div 
            className={`nav-item ${activeMenuItem === 'team' ? 'active' : ''}`}
            onClick={() => setActiveMenuItem('team')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Team</span>
          </div>
          <div 
            className={`nav-item ${activeMenuItem === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveMenuItem('profile')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="new-project-btn">
            <span>+</span> New Project
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search milestones, documents, feedback..." />
          </div>
          <div className="top-bar-actions">
            <button className="icon-btn">🔔</button>
            <button className="icon-btn">⚙️</button>
            <div 
              className="user-avatar" 
              onClick={() => setActiveMenuItem('profile')}
              title="Xem hồ sơ cá nhân"
            >
              {user.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
