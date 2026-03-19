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
  const [userInitial, setUserInitial] = useState('U');
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
      setUserInitial(user?.fullName?.charAt(0)?.toUpperCase() || 'U');
      setUserInfo({
        fullName: user?.fullName || 'Unknown Student',
        email: user?.email || ''
      });
    } catch (error) {
      setUserInitial('U');
      setUserInfo({ fullName: 'Unknown Student', email: '' });
    }
  }, [navigate]);

  const handleSubmitForApproval = () => {
    if (!projectName.trim() || !description.trim()) {
      setError('Project Name va Description la bat buoc.');
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

  const addTech = () => {
    const value = techInput.trim();
    if (!value || techStack.includes(value)) {
      return;
    }

    setTechStack((prev) => [...prev, value]);
    setTechInput('');
  };

  const removeTech = (name) => {
    setTechStack((prev) => prev.filter((item) => item !== name));
  };

  return (
    <div className="project-page">
      <header className="project-topbar">
        <div className="project-brand">
          <span className="project-brand-icon">🎓</span>
          <span className="project-brand-text">MentorAI Grad</span>
        </div>

        <div className="project-search">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search milestones, documents, feedback..." />
        </div>

        <div className="project-actions">
          <button className="icon-btn" type="button">🔔</button>
          <button className="icon-btn" type="button">⚙️</button>
          <div className="user-avatar">{userInitial}</div>
        </div>
      </header>

      <main className="project-main">
        <div className="project-register-container">
          <button className="back-dashboard-btn" onClick={() => navigate('/dashboard')}>
            ← BACK TO DASHBOARD
          </button>

          <div className="register-project-header">
            <h1>Register New Project</h1>
            <p className="subtitle">
              Submit your capstone project details for faculty approval. Ensure all technical requirements are met.
            </p>
          </div>

          <div className="register-project-card">
            <div className="register-field">
              <label>Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., AI-Driven Traffic Management System"
              />
            </div>

            <div className="register-field">
              <label>Description</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed overview of the project goals, target audience, and the problem it aims to solve."
              />
            </div>

            <div className="register-field">
              <label>Technology Stack</label>
              <div className="tech-chips">
                {techStack.map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    className="tech-chip"
                    onClick={() => removeTech(tech)}
                    title="Remove"
                  >
                    {tech} ×
                  </button>
                ))}
                <button type="button" className="add-tech-btn" onClick={addTech}>+ Add Tech</button>
              </div>

              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                placeholder="Type a technology and press enter..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTech();
                  }
                }}
              />
            </div>

            <div className="project-note-box">
              ⓘ Once submitted, the project will be reviewed by the faculty coordinator. You will receive an email
              notification once a decision is made.
            </div>

            {error && <div className="project-form-error">{error}</div>}

            <div className="project-register-actions">
              <button type="button" className="submit-project-btn" onClick={handleSubmitForApproval}>Submit for Approval ▷</button>
              <button type="button" className="save-draft-btn">Save as Draft</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectRegistration;
