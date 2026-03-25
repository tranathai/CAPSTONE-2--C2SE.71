import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const PROJECT_SUBMISSIONS_KEY = 'mentorai_project_submissions';

const readProjectSubmissions = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROJECT_SUBMISSIONS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const writeProjectSubmissions = (submissions) => {
  localStorage.setItem(PROJECT_SUBMISSIONS_KEY, JSON.stringify(submissions));
};

const ROADMAP_MILESTONE_TEMPLATE = [
  { id: 'proposal', title: 'Đề cương', weeksFromStart: 2 },
  { id: 'midterm', title: 'Giữa kỳ', weeksFromStart: 6 },
  { id: 'final', title: 'Cuối kỳ', weeksFromStart: 10 }
];

const formatShortDate = (dateIso) => {
  if (!dateIso) {
    return 'Unknown date';
  }

  return new Date(dateIso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const addWeeksToDate = (dateIso, weeks) => {
  const base = new Date(dateIso);
  if (Number.isNaN(base.getTime())) {
    return null;
  }

  const result = new Date(base);
  result.setDate(result.getDate() + weeks * 7);
  return result.toISOString();
};

const createRoadmapMilestones = (startDateIso) => {
  return ROADMAP_MILESTONE_TEMPLATE
    .map((item) => {
      const deadline = addWeeksToDate(startDateIso, item.weeksFromStart);
      if (!deadline) {
        return null;
      }

      return {
        id: item.id,
        title: item.title,
        weeksFromStart: item.weeksFromStart,
        deadline
      };
    })
    .filter(Boolean);
};

const getSubmissionRoadmap = (submission) => {
  if (!submission) {
    return [];
  }

  if (Array.isArray(submission.roadmapMilestones) && submission.roadmapMilestones.length > 0) {
    return submission.roadmapMilestones;
  }

  const startDate = submission.startDate || submission.reviewedAt || submission.submittedAt;
  if (!startDate) {
    return [];
  }

  return createRoadmapMilestones(startDate);
};

const normalizeSubmissionStatus = (rawStatus) => {
  const value = String(rawStatus || '').trim().toLowerCase();

  if (['accepted', 'approve', 'approved', 'access'].includes(value)) {
    return 'accepted';
  }

  if (['deny', 'denied', 'reject', 'rejected', 'at risk', 'at-risk'].includes(value)) {
    return 'deny';
  }

  return 'pending';
};

const getSubmissionStatusLabel = (status) => {
  if (status === 'accepted') {
    return 'Approved';
  }

  if (status === 'deny') {
    return 'Declined';
  }

  return 'Pending';
};

const getSubmissionActionLabel = (status) => {
  if (status === 'accepted') {
    return 'View Details';
  }

  if (status === 'deny') {
    return 'View Feedback';
  }

  return 'Review';
};

const getStudentStatusCardConfig = (status) => {
  if (status === 'new') {
    return {
      value: 'New',
      icon: '🆕',
      iconClassName: 'neutral',
      badgeClassName: 'neutral',
      badgeText: 'Create your first project submission'
    };
  }

  if (status === 'accepted') {
    return {
      value: 'Approved',
      icon: '✓',
      iconClassName: 'success',
      badgeClassName: 'success',
      badgeText: '✓ Approved by instructor'
    };
  }

  if (status === 'deny') {
    return {
      value: 'Declined',
      icon: '✕',
      iconClassName: 'danger',
      badgeClassName: 'danger',
      badgeText: '✕ Please revise and resubmit'
    };
  }

  return {
    value: 'Pending',
    icon: '⏳',
    iconClassName: 'warning',
    badgeClassName: 'pending',
    badgeText: '⏳ Waiting for review'
  };
};

const buildSubmissionKey = (item, index = 0) => {
  if (item?.id) {
    return String(item.id);
  }

  return `${item?.studentName || 'unknown'}-${item?.projectTitle || item?.projectName || 'untitled'}-${item?.submittedAt || index}`;
};

const extractTechStack = (submission) => {
  const raw = submission?.techStack ?? submission?.technologyStack ?? submission?.technologies;

  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

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
  const navigate = useNavigate();
  const isInstructor = user?.role === 'teacher';
  const [instructorSubmissions, setInstructorSubmissions] = useState([]);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [activeReview, setActiveReview] = useState(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [reviewError, setReviewError] = useState('');

  const latestStudentSubmission = !isInstructor && studentSubmissions.length > 0
    ? [...studentSubmissions].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.submittedAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.submittedAt || 0).getTime();
      return bTime - aTime;
    })[0]
    : null;

  const latestStudentStatus = latestStudentSubmission
    ? normalizeSubmissionStatus(latestStudentSubmission.status)
    : 'new';
  const studentStatusCard = getStudentStatusCardConfig(latestStudentStatus);
  const latestApprovedSubmission = !isInstructor
    ? [...studentSubmissions]
      .filter((item) => normalizeSubmissionStatus(item.status) === 'accepted')
      .sort((a, b) => {
        const aTime = new Date(a.reviewedAt || a.updatedAt || a.submittedAt || 0).getTime();
        const bTime = new Date(b.reviewedAt || b.updatedAt || b.submittedAt || 0).getTime();
        return bTime - aTime;
      })[0] || null
    : null;
  const studentRoadmapMilestones = getSubmissionRoadmap(latestApprovedSubmission);
  const upcomingMilestone = studentRoadmapMilestones.find((item) => new Date(item.deadline).getTime() >= Date.now())
    || studentRoadmapMilestones[studentRoadmapMilestones.length - 1]
    || null;
  const activeMilestoneIndex = studentRoadmapMilestones.findIndex((item) => new Date(item.deadline).getTime() >= Date.now());
  const resolvedActiveMilestoneIndex = activeMilestoneIndex === -1
    ? Math.max(studentRoadmapMilestones.length - 1, 0)
    : activeMilestoneIndex;

  useEffect(() => {
    if (isInstructor) {
      const allSubmissions = readProjectSubmissions();
      const pendingOnly = allSubmissions.filter((item) => normalizeSubmissionStatus(item.status) === 'pending');
      setInstructorSubmissions(pendingOnly.slice(0, 6));
    } else {
      const allSubmissions = readProjectSubmissions();
      const mySubmissions = allSubmissions.filter((item) => item.studentEmail === user?.email);
      setStudentSubmissions(mySubmissions);
    }
  }, [isInstructor, user?.email]);

  const openReviewModal = (submission, index) => {
    setActiveReview({
      ...submission,
      reviewKey: buildSubmissionKey(submission, index)
    });
    setDecisionReason(submission.reviewReason || '');
    setReviewError('');
  };

  const closeReviewModal = () => {
    setActiveReview(null);
    setDecisionReason('');
    setReviewError('');
  };

  const submitReviewDecision = (nextStatus) => {
    const reason = decisionReason.trim();

    if (!reason) {
      setReviewError('Vui long nhap ly do khi duyet hoac tu choi.');
      return;
    }

    const currentSubmissions = readProjectSubmissions();
    const reviewTime = new Date().toISOString();
    const updatedSubmissions = currentSubmissions.map((item, index) => {
      const itemKey = buildSubmissionKey(item, index);

      if (itemKey !== activeReview.reviewKey) {
        return item;
      }

      const shouldCreateRoadmap = normalizeSubmissionStatus(nextStatus) === 'accepted';
      const startDate = shouldCreateRoadmap ? (item.startDate || reviewTime) : item.startDate;

      return {
        ...item,
        status: nextStatus,
        reviewReason: reason,
        reviewedAt: reviewTime,
        startDate,
        roadmapMilestones: shouldCreateRoadmap ? createRoadmapMilestones(startDate) : item.roadmapMilestones,
        reviewedBy: user?.fullName || 'Instructor'
      };
    });

    writeProjectSubmissions(updatedSubmissions);
    setInstructorSubmissions(updatedSubmissions.slice(0, 6));
    closeReviewModal();
  };

  const handleSubmitUpdate = () => {
    if (!isInstructor && studentSubmissions.length > 0) {
      const pendingSubmission = studentSubmissions.find((item) => normalizeSubmissionStatus(item.status) === 'pending');
      if (pendingSubmission) {
        navigate('/project/ProjectRegistration', { state: { editSubmissionId: pendingSubmission.id, editSubmission: pendingSubmission } });
        return;
      }
    }
    navigate('/project/ProjectRegistration');
  };

  return (
    <>
      <div className="content-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="subtitle">
            {isInstructor
              ? 'Manage and monitor your assigned capstone projects.'
              : `Welcome back, ${user?.fullName?.split(' ')[0] || 'Alex'}. Your project is on track.`}
          </p>
        </div>
        <button className="submit-update-btn" onClick={handleSubmitUpdate}>+ Submit Update</button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Project Status</span>
            <span className={`stat-icon ${isInstructor ? 'success' : studentStatusCard.iconClassName}`}>
              {isInstructor ? '✓' : studentStatusCard.icon}
            </span>
          </div>
          <div className="stat-value">{isInstructor ? 'Approved' : studentStatusCard.value}</div>
          <div className="stat-footer">
            <span className={`badge ${isInstructor ? 'success' : studentStatusCard.badgeClassName}`}>
              {isInstructor ? '✓ Fully validated' : studentStatusCard.badgeText}
            </span>
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
          <div className="stat-value">
            {isInstructor
              ? 'Oct 20'
              : (upcomingMilestone ? formatShortDate(upcomingMilestone.deadline) : 'TBD')}
          </div>
          <div className="stat-footer">
            <span className="badge">
              {isInstructor
                ? 'Final Draft Submission'
                : (upcomingMilestone ? upcomingMilestone.title : 'Auto after approval')}
            </span>
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
        {isInstructor ? (
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
        ) : (
          studentRoadmapMilestones.length === 0 ? (
            <div className="submission-empty">
              Roadmap milestones are generated automatically after your project is approved.
            </div>
          ) : (
            <div className="roadmap">
              {studentRoadmapMilestones.map((milestone, index) => {
                const isCompleted = index < resolvedActiveMilestoneIndex;
                const isActive = index === resolvedActiveMilestoneIndex;
                const stepClassName = isCompleted ? 'completed' : (isActive ? 'active' : '');
                const connectorClassName = index < resolvedActiveMilestoneIndex
                  ? 'completed'
                  : (index === resolvedActiveMilestoneIndex ? 'active' : '');

                return (
                  <React.Fragment key={milestone.id || `${milestone.title}-${index}`}>
                    <div className={`roadmap-step ${stepClassName}`}>
                      <div className="step-icon">
                        {isCompleted ? '✓' : (isActive ? '▶' : '⏱️')}
                      </div>
                      <div className="step-info">
                        <div className="step-title">{milestone.title}</div>
                        <div className="step-date">Deadline {formatShortDate(milestone.deadline)}</div>
                      </div>
                    </div>
                    {index < studentRoadmapMilestones.length - 1 && (
                      <div className={`roadmap-connector ${connectorClassName}`}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Recent Submissions */}
      <div className="section-card">
        <div className="section-header">
          <h2>Recent Submissions</h2>
          <span className="time-badge">Latest project proposals</span>
        </div>
        {isInstructor ? (
          <div className="submissions-table-wrapper">
            {instructorSubmissions.length === 0 ? (
              <div className="submission-empty">
                No submissions yet. Projects submitted from New Project will appear here.
              </div>
            ) : (
              <table className="submissions-table">
                <thead>
                  <tr>
                    <th>STUDENT NAME</th>
                    <th>PROJECT TITLE</th>
                    <th>STATUS</th>
                    <th>DATE SUBMITTED</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {instructorSubmissions.map((item, index) => {
                    const status = normalizeSubmissionStatus(item.status);
                    const studentName = item.studentName || item.submittedBy || 'Unknown Student';
                    const projectTitle = item.projectTitle || item.projectName || 'Untitled Project';

                    return (
                      <tr key={buildSubmissionKey(item, index)}>
                        <td>
                          <div className="student-cell">
                            <span className="student-avatar">{studentName.charAt(0).toUpperCase()}</span>
                            <span>{studentName}</span>
                          </div>
                        </td>
                        <td>{projectTitle}</td>
                        <td>
                          <span className={`table-status ${status}`}>• {getSubmissionStatusLabel(status)}</span>
                        </td>
                        <td>{formatShortDate(item.submittedAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => openReviewModal(item, index)}
                          >
                            {getSubmissionActionLabel(status)}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="submissions-list">
            {studentSubmissions.length === 0 ? (
              <div className="submission-empty">
                No projects yet. Click "+ New Project" to create your first project submission.
              </div>
            ) : (
              studentSubmissions.map((item, index) => {
                const status = normalizeSubmissionStatus(item.status);
                const projectTitle = item.projectTitle || item.projectName || 'Untitled Project';

                return (
                  <div key={buildSubmissionKey(item, index)} className="submission-item">
                    <div className="submission-icon">📋</div>
                    <div className="submission-info">
                      <div className="submission-name">{projectTitle}</div>
                      <div className="submission-meta">
                        Submitted {formatShortDate(item.submittedAt)}
                        {item.description && ` • ${item.description.substring(0, 50)}...`}
                      </div>
                    </div>
                    <div className="submission-status-container">
                      <div className="submission-status-label">Status</div>
                      <span className={`submission-status ${status}`}>
                        {status === 'pending' && '⏳ Pending'}
                        {status === 'accepted' && '✓ Approved'}
                        {status === 'deny' && '✕ Declined'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {isInstructor && activeReview && (
        <div className="review-modal-overlay" onClick={closeReviewModal}>
          <div className="review-modal" onClick={(event) => event.stopPropagation()}>
            <div className="review-modal-header">
              <h3>Review Project Submission</h3>
              <button type="button" className="review-close-btn" onClick={closeReviewModal}>x</button>
            </div>

            <div className="review-modal-body">
              <div className="review-field">
                <span className="review-label">Project Name</span>
                <div className="review-value">{activeReview.projectTitle || activeReview.projectName || 'Untitled Project'}</div>
              </div>

              <div className="review-field">
                <span className="review-label">Description</span>
                <div className="review-value">{activeReview.description || 'No description provided.'}</div>
              </div>

              <div className="review-field">
                <span className="review-label">Technology Stack</span>
                <div className="review-tech-list">
                  {extractTechStack(activeReview).length > 0 ? (
                    extractTechStack(activeReview).map((tech) => (
                      <span className="review-tech-chip" key={tech}>{tech}</span>
                    ))
                  ) : (
                    <span className="review-value">No technology stack provided.</span>
                  )}
                </div>
              </div>

              <div className="review-field">
                <span className="review-label">Ly do</span>
                <textarea
                  rows={4}
                  className="review-reason-input"
                  placeholder="Nhap ly do duyet hoac tu choi..."
                  value={decisionReason}
                  onChange={(event) => setDecisionReason(event.target.value)}
                />
                {reviewError && <div className="review-error">{reviewError}</div>}
              </div>
            </div>

            <div className="review-modal-actions">
              <button
                type="button"
                className="decision-btn accept"
                onClick={() => submitReviewDecision('access')}
              >
                Duyet (accept)
              </button>
              <button
                type="button"
                className="decision-btn deny"
                onClick={() => submitReviewDecision('deny')}
              >
                Tu choi (deny)
              </button>
            </div>
          </div>
        </div>
      )}
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

    const parsedUser = JSON.parse(userData);

    if (parsedUser?.role === 'teacher') {
      navigate('/teacher-dashboard', { replace: true });
      return;
    }

    setUser(parsedUser);
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
          <button className="student-new-project-btn" onClick={() => navigate('/project/ProjectRegistration')}>
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
