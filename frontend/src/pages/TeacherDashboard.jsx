import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

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

const getStatusLabel = (status) => {
  if (status === 'accepted') {
    return 'Approved';
  }

  if (status === 'deny') {
    return 'Declined';
  }

  return 'Pending';
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

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [activeReview, setActiveReview] = useState(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [reviewError, setReviewError] = useState('');

  const totalProjects = allSubmissions.length;
  const pendingReviews = allSubmissions.filter((item) => normalizeSubmissionStatus(item.status) === 'pending').length;
  const approvedProjects = allSubmissions.filter((item) => normalizeSubmissionStatus(item.status) === 'accepted').length;
  const projectsAtRisk = allSubmissions.filter((item) => normalizeSubmissionStatus(item.status) === 'deny').length;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser?.role !== 'teacher') {
      navigate('/dashboard');
      return;
    }

    setUser(parsedUser);

    // Load submissions from localStorage
    const allSubmissions = readProjectSubmissions();
    setAllSubmissions(allSubmissions);
    let filtered = allSubmissions;

    if (statusFilter === 'pending') {
      filtered = allSubmissions.filter((item) => normalizeSubmissionStatus(item.status) === 'pending');
    } else if (statusFilter === 'reviewed') {
      filtered = allSubmissions.filter(
        (item) => ['accepted', 'deny'].includes(normalizeSubmissionStatus(item.status))
      );
    }

    setSubmissions(filtered);
  }, [navigate, statusFilter]);

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
        reviewedBy: user?.fullName || 'Instructor'
      };
    });

    writeProjectSubmissions(updatedSubmissions);
    setAllSubmissions(updatedSubmissions);
    
    // Refresh submissions list
    let filtered = updatedSubmissions;
    if (statusFilter === 'pending') {
      filtered = updatedSubmissions.filter((item) => normalizeSubmissionStatus(item.status) === 'pending');
    } else if (statusFilter === 'reviewed') {
      filtered = updatedSubmissions.filter(
        (item) => ['accepted', 'deny'].includes(normalizeSubmissionStatus(item.status))
      );
    }
    setSubmissions(filtered);
    closeReviewModal();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return <div className="teacher-loading">Loading...</div>;
  }

  return (
    <div className="teacher-page-wrap">
      <aside className="teacher-sidebar">
        <div className="teacher-brand">
          <div className="brand-mark">■</div>
          <span>MentorAI Grad</span>
        </div>

        <div className="teacher-profile-card">
          <div className="teacher-avatar">{user.fullName?.charAt(0)?.toUpperCase() || 'T'}</div>
          <div>
            <p className="teacher-name">{user.fullName}</p>
            <p className="teacher-role">Senior Instructor</p>
          </div>
        </div>

        <nav className="teacher-nav">
          <button className="nav-link active">Dashboard</button>
          <button className="nav-link">Projects</button>
          <button className="nav-link">Submissions</button>
          <button className="nav-link">Teams</button>
          <button className="nav-link">Settings</button>
        </nav>
      </aside>

      <main className="teacher-main">
        <header className="teacher-header">
          <input className="teacher-search" placeholder="Search projects, students..." />
          <div className="teacher-header-right">
            <button className="header-icon" aria-label="notifications">🔔</button>
            <button className="header-icon" aria-label="messages">💬</button>
            <button className="logout-mini" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <section className="teacher-overview">
          <h1>Dashboard Overview</h1>
          <p>Manage and monitor your assigned capstone projects.</p>
        </section>

        <section className="teacher-cards">
          <article className="overview-card">
            <p className="chip good">{approvedProjects} approved</p>
            <h3>Total Projects</h3>
            <strong>{totalProjects}</strong>
          </article>

          <article className="overview-card">
            <p className="chip warm">{pendingReviews} waiting</p>
            <h3>Pending Reviews</h3>
            <strong>{pendingReviews}</strong>
          </article>

          <article className="overview-card">
            <p className="chip bad">{projectsAtRisk} declined</p>
            <h3>Projects at Risk</h3>
            <strong>{projectsAtRisk}</strong>
          </article>
        </section>

        <section className="teacher-table-wrap">
          <div className="table-top">
            <h2>Recent Submissions</h2>
            <a href="#all">View All</a>
          </div>

          <div className="submission-filter-tabs">
            <button
              className={`filter-tab ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              ⏳ Waiting for Review
            </button>
            <button
              className={`filter-tab ${statusFilter === 'reviewed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('reviewed')}
            >
              ✓ Reviewed
            </button>
          </div>

          {submissions.length === 0 ? (
            <div className="submission-empty">
              {statusFilter === 'pending'
                ? 'No pending submissions. All assignments have been reviewed!'
                : 'No reviewed submissions yet.'}
            </div>
          ) : (
            <table className="teacher-table">
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
                {submissions.map((row, index) => {
                  const status = normalizeSubmissionStatus(row.status);
                  const studentName = row.studentName || row.submittedBy || 'Unknown Student';
                  const projectTitle = row.projectTitle || row.projectName || 'Untitled Project';

                  return (
                    <tr key={buildSubmissionKey(row, index)}>
                      <td>{studentName}</td>
                      <td>{projectTitle}</td>
                      <td>
                        <span className={`status-pill ${status}`}>{getStatusLabel(status)}</span>
                      </td>
                      <td>{formatShortDate(row.submittedAt)}</td>
                      <td>
                        <button
                          className="action-btn"
                          onClick={() => openReviewModal(row, index)}
                        >
                          {status === 'pending' ? 'Review' : status === 'accepted' ? 'View Details' : 'View Feedback'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {activeReview && (
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
      </main>
    </div>
  );
};

export default TeacherDashboard;