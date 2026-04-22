import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { lookupUserByEmail } from '../lib/api';
import './ProjectRegistration.css';

const PROJECT_SUBMISSIONS_KEY = 'mentorai_project_submissions';
const GMAIL_REGEX = /^[^\s@]+@(gmail\.com|gmail\.edu\.vn)$/i;

const normalizeMember = (member) => {
  const email = String(member?.email || '').trim().toLowerCase();
  if (!email) {
    return null;
  }

  return {
    email,
    fullName: String(member?.fullName || email.split('@')[0] || 'Member').trim(),
    role: String(member?.role || 'student').trim() || 'student'
  };
};

const ProjectRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState(['Python', 'TensorFlow', 'React']);
  const [userInitial, setUserInitial] = useState('S');
  const [userInfo, setUserInfo] = useState({ fullName: 'Unknown Student', email: '' });
  const [memberEmailInput, setMemberEmailInput] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [memberError, setMemberError] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [error, setError] = useState('');
  const [editSubmissionId, setEditSubmissionId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/');
      return;
    }

    try {
      const user = JSON.parse(userData);
      setUserInitial(user?.fullName?.charAt(0)?.toUpperCase() || 'S');
      setUserInfo({
        fullName: user?.fullName || 'Unknown Student',
        email: user?.email || ''
      });

      const currentUserMember = normalizeMember({
        email: user?.email,
        fullName: user?.fullName,
        role: user?.role || 'student'
      });

      if (currentUserMember) {
        setTeamMembers([currentUserMember]);
      }

      // Check if we're in edit mode
      if (location.state?.editSubmissionId && location.state?.editSubmission) {
        const submission = location.state.editSubmission;
        setEditSubmissionId(submission.id);
        setProjectName(submission.projectTitle || '');
        setDescription(submission.description || '');
        setTechStack(Array.isArray(submission.techStack) ? submission.techStack : ['Python', 'TensorFlow', 'React']);

        const existingMembers = Array.isArray(submission.teamMembers)
          ? submission.teamMembers.map(normalizeMember).filter(Boolean)
          : [];

        if (currentUserMember) {
          const mergedMembers = [
            currentUserMember,
            ...existingMembers.filter((member) => member.email !== currentUserMember.email)
          ];
          setTeamMembers(mergedMembers);
        } else if (existingMembers.length > 0) {
          setTeamMembers(existingMembers);
        }
      }
    } catch (parseError) {
      setUserInitial('S');
      setUserInfo({ fullName: 'Unknown Student', email: '' });
      setTeamMembers([]);
    }
  }, [navigate, location.state]);

  const addTech = () => {
    const value = techInput.trim();
    if (!value || techStack.includes(value)) {
      return;
    }

    setTechStack((prev) => [...prev, value]);
    setTechInput('');
  };

  const removeTech = (itemToRemove) => {
    setTechStack((prev) => prev.filter((item) => item !== itemToRemove));
  };

  const addTeamMember = async () => {
    const normalizedEmail = String(memberEmailInput || '').trim().toLowerCase();

    if (!normalizedEmail) {
      setMemberError('Vui long nhap email thanh vien.');
      return;
    }

    if (!GMAIL_REGEX.test(normalizedEmail)) {
      setMemberError('Email phai co duoi @gmail.com hoac @gmail.edu.vn.');
      return;
    }

    const duplicate = teamMembers.some((member) => member.email === normalizedEmail);
    if (duplicate) {
      setMemberError('Email nay da co trong nhom.');
      return;
    }

    try {
      setMemberLoading(true);
      setMemberError('');
      const lookupResult = await lookupUserByEmail(normalizedEmail);

      if (!lookupResult?.exists || !lookupResult?.user) {
        setMemberError('Email nay chua dang ky tai khoan.');
        return;
      }

      if (lookupResult.user.role !== 'student') {
        setMemberError('Chi co the them tai khoan sinh vien vao nhom.');
        return;
      }

      const normalized = normalizeMember(lookupResult.user);
      if (!normalized) {
        setMemberError('Khong the them thanh vien nay.');
        return;
      }

      setTeamMembers((prev) => [...prev, normalized]);
      setMemberEmailInput('');
    } catch (lookupError) {
      setMemberError(lookupError?.message || 'Khong kiem tra duoc email thanh vien.');
    } finally {
      setMemberLoading(false);
    }
  };

  const removeTeamMember = (emailToRemove) => {
    const ownerEmail = String(userInfo.email || '').trim().toLowerCase();
    if (emailToRemove === ownerEmail) {
      setMemberError('Khong the xoa truong nhom khoi du an.');
      return;
    }

    setMemberError('');
    setTeamMembers((prev) => prev.filter((member) => member.email !== emailToRemove));
  };

  const handleSubmitForApproval = () => {
    if (!projectName.trim() || !description.trim()) {
      setError('Project Name and Description are required.');
      return;
    }

    if (teamMembers.length === 0) {
      setError('Du an phai co it nhat 1 thanh vien.');
      return;
    }

    const normalizedTechStack = techStack
      .map((item) => String(item).trim())
      .filter(Boolean);

    const normalizedMembers = teamMembers
      .map(normalizeMember)
      .filter(Boolean);

    let current = [];
    try {
      current = JSON.parse(localStorage.getItem(PROJECT_SUBMISSIONS_KEY) || '[]');
      if (!Array.isArray(current)) {
        current = [];
      }
    } catch (parseError) {
      current = [];
    }

    if (editSubmissionId) {
      // Edit mode: update existing submission
      const updatedSubmissions = current.map((item) => {
        if (item.id === editSubmissionId) {
          return {
            ...item,
            projectTitle: projectName.trim(),
            description: description.trim(),
            techStack: normalizedTechStack,
            teamMembers: normalizedMembers,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      localStorage.setItem(PROJECT_SUBMISSIONS_KEY, JSON.stringify(updatedSubmissions));
    } else {
      // Create mode: add new submission
      const payload = {
        id: `submission_${Date.now()}`,
        projectTitle: projectName.trim(),
        description: description.trim(),
        techStack: normalizedTechStack,
        teamMembers: normalizedMembers,
        studentName: userInfo.fullName,
        studentEmail: userInfo.email,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };
      localStorage.setItem(PROJECT_SUBMISSIONS_KEY, JSON.stringify([payload, ...current]));
    }

    navigate('/dashboard');
  };

  return (
    <div className="project-registration-page">
      <header className="project-topbar">
        <div className="project-brand-wrap">
          <span className="project-brand-icon">🎓</span>
          <span className="project-brand-text">MentorAI Grad</span>
        </div>

        <div className="project-top-search">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search milestones, documents, feedback..." />
        </div>

        <div className="project-top-actions">
          <button type="button" className="project-icon-btn" aria-label="Notifications">🔔</button>
          <button type="button" className="project-icon-btn" aria-label="Settings">⚙️</button>
          <div className="project-user-avatar">{userInitial}</div>
        </div>
      </header>

      <main className="project-main-content">
        <div className="project-form-shell">
          <button type="button" className="back-dashboard-link" onClick={() => navigate('/dashboard')}>
            BACK TO DASHBOARD
          </button>

          <h1>{editSubmissionId ? 'Edit Project' : 'Register New Project'}</h1>
          <p className="project-subtitle">
            {editSubmissionId
              ? 'Update your capstone project details. Your changes will be resubmitted for approval.'
              : 'Submit your capstone project details for faculty approval. Ensure all technical requirements are met.'}
          </p>

          <section className="project-form-card">
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="e.g., AI-Driven Traffic Management System"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Provide a detailed overview of the project goals, target audience, and the problem it aims to solve."
              />
            </div>

            <div className="form-group">
              <label>Technology Stack</label>
              <div className="tech-chip-row">
                {techStack.map((item) => (
                  <button key={item} type="button" className="tech-chip" onClick={() => removeTech(item)}>
                    {item} x
                  </button>
                ))}
                <button type="button" className="add-tech-chip" onClick={addTech}>
                  + Add Tech
                </button>
              </div>

              <input
                type="text"
                value={techInput}
                onChange={(event) => setTechInput(event.target.value)}
                placeholder="Type a technology and press enter..."
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTech();
                  }
                }}
              />
            </div>

            <div className="form-group">
              <label>Team Members</label>
              <p className="members-help-text">
                Them hoac xoa thanh vien bang email da dang ky tai khoan.
              </p>
              <div className="member-input-row">
                <input
                  type="email"
                  value={memberEmailInput}
                  onChange={(event) => {
                    setMemberEmailInput(event.target.value);
                    setMemberError('');
                  }}
                  placeholder="member@gmail.com"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      if (!memberLoading) {
                        addTeamMember();
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="member-add-btn"
                  onClick={addTeamMember}
                  disabled={memberLoading}
                >
                  {memberLoading ? 'Dang them...' : '+ Add Member'}
                </button>
              </div>

              {memberError && <div className="project-form-error">{memberError}</div>}

              <div className="member-list">
                {teamMembers.length === 0 ? (
                  <div className="member-empty">Chua co thanh vien trong nhom.</div>
                ) : (
                  teamMembers.map((member) => {
                    const ownerEmail = String(userInfo.email || '').trim().toLowerCase();
                    const isOwner = member.email === ownerEmail;

                    return (
                      <div className="member-item" key={member.email}>
                        <div className="member-meta">
                          <div className="member-name">{member.fullName}</div>
                          <div className="member-email">{member.email}</div>
                        </div>
                        <button
                          type="button"
                          className="member-remove-btn"
                          disabled={isOwner}
                          onClick={() => removeTeamMember(member.email)}
                          title={isOwner ? 'Truong nhom khong the bi xoa' : 'Xoa thanh vien'}
                        >
                          {isOwner ? 'Owner' : 'Remove'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="project-note-box">
              <span>ⓘ</span>
              <span>
                {editSubmissionId
                  ? 'Save your changes and the project will be resubmitted for faculty approval.'
                  : 'Once submitted, the project will be reviewed by the faculty coordinator. You will receive an email notification once a decision is made.'}
              </span>
            </div>

            {error && <div className="project-form-error">{error}</div>}

            <div className="project-action-row">
              <button type="button" className="submit-btn" onClick={handleSubmitForApproval}>
                {editSubmissionId ? 'Save Changes' : 'Submit for Approval'}
              </button>
              <button type="button" className="draft-btn">Save as Draft</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ProjectRegistration;