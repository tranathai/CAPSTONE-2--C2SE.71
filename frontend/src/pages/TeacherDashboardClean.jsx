import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setRuntimeRole } from '../config/runtimeRole';
import SubmissionsPage from '../components/Content/Student/SubmissionsPage';
import './TeacherDashboard.css';

const PROJECT_SUBMISSIONS_KEY = 'mentorai_project_submissions';

const readProjectSubmissions = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROJECT_SUBMISSIONS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeProjectSubmissions = (submissions) => {
  localStorage.setItem(PROJECT_SUBMISSIONS_KEY, JSON.stringify(submissions));
};

const formatShortDate = (dateIso) => {
  if (!dateIso) return 'Unknown date';
  return new Date(dateIso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const normalizeSubmissionStatus = (rawStatus) => {
  const value = String(rawStatus || '').trim().toLowerCase();
  if (['accepted', 'approve', 'approved', 'access'].includes(value)) return 'accepted';
  if (['deny', 'denied', 'reject', 'rejected', 'at risk', 'at-risk'].includes(value)) return 'deny';
  return 'pending';
};

const getStatusLabel = (status) => {
  if (status === 'accepted') return 'Approved';
  if (status === 'deny') return 'Declined';
  return 'Pending';
};

const buildSubmissionKey = (item, index = 0) => {
  if (item?.id) return String(item.id);
  return `${item?.studentName || 'unknown'}-${item?.projectTitle || item?.projectName || 'untitled'}-${item?.submittedAt || index}`;
};

const extractTechStack = (submission) => {
  const raw = submission?.techStack ?? submission?.technologyStack ?? submission?.technologies;
  if (Array.isArray(raw)) return raw.map((item) => String(item).trim()).filter(Boolean);
  if (typeof raw === 'string') return raw.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
};

const MILESTONE_FIELDS = [
  { id: 'proposal', label: 'Milestone 1 - Proposal' },
  { id: 'midterm', label: 'Milestone 2 - Midterm' },
  { id: 'final', label: 'Milestone 3 - Final' },
];

const emptyMilestoneDates = {
  proposal: '',
  midterm: '',
  final: '',
};

const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const addWeeksToDateInput = (baseDateIso, weeks) => {
  if (!baseDateIso) return '';
  const base = new Date(baseDateIso);
  if (Number.isNaN(base.getTime())) return '';
  const next = new Date(base);
  next.setDate(next.getDate() + weeks * 7);
  return next.toISOString().slice(0, 10);
};

const getInitialMilestoneDates = (submission) => {
  const roadmapMilestones = Array.isArray(submission?.roadmapMilestones)
    ? submission.roadmapMilestones
    : [];

  if (roadmapMilestones.length > 0) {
    return {
      proposal: toDateInputValue(roadmapMilestones.find((item) => item.id === 'proposal')?.deadline),
      midterm: toDateInputValue(roadmapMilestones.find((item) => item.id === 'midterm')?.deadline),
      final: toDateInputValue(roadmapMilestones.find((item) => item.id === 'final')?.deadline),
    };
  }

  const submittedAt = submission?.submittedAt || new Date().toISOString();
  return {
    proposal: addWeeksToDateInput(submittedAt, 2),
    midterm: addWeeksToDateInput(submittedAt, 6),
    final: addWeeksToDateInput(submittedAt, 10),
  };
};

const getTodayDateInputValue = () => new Date().toISOString().slice(0, 10);

const extractTeamMembers = (submission) => {
  const members = Array.isArray(submission?.teamMembers) ? submission.teamMembers : [];
  if (members.length > 0) {
    return members
      .map((member) => {
        const email = String(member?.email || '').trim().toLowerCase();
        const fullName = String(member?.fullName || email.split('@')[0] || 'Team Member').trim();
        if (!email) return null;
        return { fullName, email };
      })
      .filter(Boolean);
  }

  const fallbackEmail = String(submission?.studentEmail || '').trim().toLowerCase();
  const fallbackName = String(submission?.studentName || submission?.submittedBy || '').trim();
  if (!fallbackEmail && !fallbackName) {
    return [];
  }

  return [{
    fullName: fallbackName || fallbackEmail.split('@')[0] || 'Team Member',
    email: fallbackEmail || 'No email provided',
  }];
};

const TeacherDashboardClean = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [activeReview, setActiveReview] = useState(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [milestoneDates, setMilestoneDates] = useState(emptyMilestoneDates);
  const [reviewError, setReviewError] = useState('');

  const totalProjects = allSubmissions.length;
  const approvedProjects = allSubmissions.filter((item) => normalizeSubmissionStatus(item.status) === 'accepted').length;
  const pendingReviewsThisMonth = allSubmissions.filter((item) => normalizeSubmissionStatus(item.status) === 'pending').length;
  const projectsAtRiskThisMonth = allSubmissions.filter((item) => normalizeSubmissionStatus(item.status) === 'deny').length;

  const submissions = allSubmissions.filter((item) => {
    if (statusFilter === 'pending') {
      return normalizeSubmissionStatus(item.status) === 'pending';
    }
    return ['accepted', 'deny'].includes(normalizeSubmissionStatus(item.status));
  });

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
    setAllSubmissions(readProjectSubmissions());
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const openSubmissions = () => {
    setRuntimeRole('supervisor');
    setActiveSection('submissions');
  };

  const openReviewModal = (submission, index) => {
    setActiveReview({
      ...submission,
      reviewKey: buildSubmissionKey(submission, index),
    });
    setDecisionReason(submission.reviewReason || '');
    setMilestoneDates(getInitialMilestoneDates(submission));
    setReviewError('');
  };

  const closeReviewModal = () => {
    setActiveReview(null);
    setDecisionReason('');
    setMilestoneDates(emptyMilestoneDates);
    setReviewError('');
  };

  const setMilestoneDate = (milestoneId, value) => {
    setMilestoneDates((prev) => ({
      ...prev,
      [milestoneId]: value,
    }));
  };

  const buildRoadmapMilestones = () => {
    return MILESTONE_FIELDS.map((item) => ({
      id: item.id,
      title: item.label,
      deadline: new Date(`${milestoneDates[item.id]}T00:00:00`).toISOString(),
    }));
  };

  const submitReviewDecision = (nextStatus) => {
    const reason = decisionReason.trim();
    if (!reason) {
      setReviewError('Vui long nhap ly do khi duyet hoac tu choi.');
      return;
    }

    if (nextStatus === 'access') {
      if (!milestoneDates.proposal || !milestoneDates.midterm || !milestoneDates.final) {
        setReviewError('Vui long nhap day du 3 moc milestone truoc khi duyet.');
        return;
      }

      const todayValue = getTodayDateInputValue();
      if (
        milestoneDates.proposal < todayValue ||
        milestoneDates.midterm < todayValue ||
        milestoneDates.final < todayValue
      ) {
        setReviewError('Milestone khong duoc dat truoc ngay hien tai.');
        return;
      }

      const proposalTime = new Date(`${milestoneDates.proposal}T00:00:00`).getTime();
      const midtermTime = new Date(`${milestoneDates.midterm}T00:00:00`).getTime();
      const finalTime = new Date(`${milestoneDates.final}T00:00:00`).getTime();

      if (!(proposalTime <= midtermTime && midtermTime <= finalTime)) {
        setReviewError('Milestone 2 phai khong som hon Milestone 1, va Milestone 3 phai khong som hon Milestone 2.');
        return;
      }
    }

    const currentSubmissions = readProjectSubmissions();
    const reviewTime = new Date().toISOString();
    const roadmapMilestones = nextStatus === 'access' ? buildRoadmapMilestones() : [];
    const updatedSubmissions = currentSubmissions.map((item, index) => {
      const itemKey = buildSubmissionKey(item, index);
      if (itemKey !== activeReview.reviewKey) {
        return item;
      }

      return {
        ...item,
        status: nextStatus,
        reviewReason: reason,
        reviewedAt: reviewTime,
        reviewedBy: user?.fullName || 'Instructor',
        roadmapMilestones,
      };
    });

    writeProjectSubmissions(updatedSubmissions);
    setAllSubmissions(updatedSubmissions);
    closeReviewModal();
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
          <button
            className={`nav-link ${activeSection === 'dashboard' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveSection('dashboard')}
          >
            Dashboard
          </button>
          <button className="nav-link" type="button">Projects</button>
          <button
            className={`nav-link ${activeSection === 'submissions' ? 'active' : ''}`}
            type="button"
            onClick={openSubmissions}
          >
            Submissions
          </button>
          <button className="nav-link" type="button">Teams</button>
          <button className="nav-link" type="button">Settings</button>
        </nav>
      </aside>

      <main className="teacher-main">
        {activeSection === 'dashboard' ? (
          <>
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
                <p className="chip warm">{pendingReviewsThisMonth} waiting this month</p>
                <h3>Pending Reviews (This Month)</h3>
                <strong>{pendingReviewsThisMonth}</strong>
              </article>
              <article className="overview-card">
                <p className="chip bad">{projectsAtRiskThisMonth} declined this month</p>
                <h3>Projects at Risk (This Month)</h3>
                <strong>{projectsAtRiskThisMonth}</strong>
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
                            <button className="action-btn" onClick={() => openReviewModal(row, index)}>
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
          </>
        ) : (
          <>
            <header className="teacher-header">
              <input className="teacher-search" placeholder="Search submissions..." />
              <div className="teacher-header-right">
                <button className="header-icon" aria-label="notifications">🔔</button>
                <button className="header-icon" aria-label="messages">💬</button>
                <button className="logout-mini" onClick={handleLogout}>Logout</button>
              </div>
            </header>
            <SubmissionsPage />
          </>
        )}

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
                  <span className="review-label">Thanh vien tham gia</span>
                  <div className="review-member-list">
                    {extractTeamMembers(activeReview).length > 0 ? (
                      extractTeamMembers(activeReview).map((member) => (
                        <div className="review-member-item" key={member.email}>
                          <strong>{member.fullName}</strong>
                          <span>{member.email}</span>
                        </div>
                      ))
                    ) : (
                      <span className="review-value">Chua co thong tin thanh vien.</span>
                    )}
                  </div>
                </div>
                <div className="review-field">
                  <span className="review-label">Milestone (bat buoc khi duyet)</span>
                  <div className="review-milestone-grid">
                    {MILESTONE_FIELDS.map((field) => (
                      <label key={field.id} className="review-milestone-item">
                        <span>{field.label}</span>
                        <input
                          type="date"
                          value={milestoneDates[field.id] || ''}
                          onChange={(event) => setMilestoneDate(field.id, event.target.value)}
                        />
                      </label>
                    ))}
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
                <button type="button" className="decision-btn accept" onClick={() => submitReviewDecision('access')}>
                  Duyet (accept)
                </button>
                <button type="button" className="decision-btn deny" onClick={() => submitReviewDecision('deny')}>
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

export default TeacherDashboardClean;
