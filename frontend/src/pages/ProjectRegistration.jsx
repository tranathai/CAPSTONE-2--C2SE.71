import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProjectRegistration.css';

const PROJECT_SUBMISSIONS_KEY = 'mentorai_project_submissions';

const ProjectRegistration = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState(['Python', 'TensorFlow', 'React']);
  const [userInitial, setUserInitial] = useState('S');
  const [userInfo, setUserInfo] = useState({ fullName: 'Unknown Student', email: '' });
  const [error, setError] = useState('');

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
    } catch (parseError) {
      setUserInitial('S');
      setUserInfo({ fullName: 'Unknown Student', email: '' });
    }
  }, [navigate]);

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

  const handleSubmitForApproval = () => {
    if (!projectName.trim() || !description.trim()) {
      setError('Project Name and Description are required.');
      return;
    }

    const normalizedTechStack = techStack
      .map((item) => String(item).trim())
      .filter(Boolean);

    const payload = {
      id: `submission_${Date.now()}`,
      projectTitle: projectName.trim(),
      description: description.trim(),
      techStack: normalizedTechStack,
      studentName: userInfo.fullName,
      studentEmail: userInfo.email,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    let current = [];
    try {
      current = JSON.parse(localStorage.getItem(PROJECT_SUBMISSIONS_KEY) || '[]');
      if (!Array.isArray(current)) {
        current = [];
      }
    } catch (parseError) {
      current = [];
    }

    localStorage.setItem(PROJECT_SUBMISSIONS_KEY, JSON.stringify([payload, ...current]));
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

          <h1>Register New Project</h1>
          <p className="project-subtitle">
            Submit your capstone project details for faculty approval. Ensure all technical requirements are met.
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

            <div className="project-note-box">
              <span>ⓘ</span>
              <span>
                Once submitted, the project will be reviewed by the faculty coordinator. You will receive an email
                notification once a decision is made.
              </span>
            </div>

            {error && <div className="project-form-error">{error}</div>}

            <div className="project-action-row">
              <button type="button" className="submit-btn" onClick={handleSubmitForApproval}>
                Submit for Approval
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