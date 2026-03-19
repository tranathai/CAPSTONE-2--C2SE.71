import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProjectRegistration.css';

<<<<<<< Updated upstream
const PROJECT_SUBMISSIONS_KEY = 'mentorai_project_submissions';

=======
>>>>>>> Stashed changes
const ProjectRegistration = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState(['Python', 'TensorFlow', 'React']);
<<<<<<< Updated upstream
  const [userInitial, setUserInitial] = useState('U');
  const [userInfo, setUserInfo] = useState({ fullName: 'Unknown Student', email: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/');
=======
  const [userInitial, setUserInitial] = useState('S');

  useEffect(() => {
    const userRaw = localStorage.getItem('user');
    if (!userRaw) {
>>>>>>> Stashed changes
      return;
    }

    try {
<<<<<<< Updated upstream
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
=======
      const parsedUser = JSON.parse(userRaw);
      setUserInitial(parsedUser?.fullName?.charAt(0)?.toUpperCase() || 'S');
    } catch (error) {
      setUserInitial('S');
    }
  }, []);
>>>>>>> Stashed changes

  const addTech = () => {
    const value = techInput.trim();
    if (!value || techStack.includes(value)) {
      return;
    }

    setTechStack((prev) => [...prev, value]);
    setTechInput('');
  };

<<<<<<< Updated upstream
  const removeTech = (name) => {
    setTechStack((prev) => prev.filter((item) => item !== name));
  };

  return (
    <div className="project-page">
      <header className="project-topbar">
        <div className="project-brand">
=======
  const removeTech = (itemToRemove) => {
    setTechStack((prev) => prev.filter((item) => item !== itemToRemove));
  };

  return (
    <div className="project-registration-page">
      <header className="project-topbar">
        <div className="project-brand-wrap">
>>>>>>> Stashed changes
          <span className="project-brand-icon">🎓</span>
          <span className="project-brand-text">MentorAI Grad</span>
        </div>

<<<<<<< Updated upstream
        <div className="project-search">
=======
        <div className="project-top-search">
>>>>>>> Stashed changes
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search milestones, documents, feedback..." />
        </div>

<<<<<<< Updated upstream
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
=======
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
>>>>>>> Stashed changes
              <label>Project Name</label>
              <input
                type="text"
                value={projectName}
<<<<<<< Updated upstream
                onChange={(e) => setProjectName(e.target.value)}
=======
                onChange={(event) => setProjectName(event.target.value)}
>>>>>>> Stashed changes
                placeholder="e.g., AI-Driven Traffic Management System"
              />
            </div>

<<<<<<< Updated upstream
            <div className="register-field">
=======
            <div className="form-group">
>>>>>>> Stashed changes
              <label>Description</label>
              <textarea
                rows={5}
                value={description}
<<<<<<< Updated upstream
                onChange={(e) => setDescription(e.target.value)}
=======
                onChange={(event) => setDescription(event.target.value)}
>>>>>>> Stashed changes
                placeholder="Provide a detailed overview of the project goals, target audience, and the problem it aims to solve."
              />
            </div>

<<<<<<< Updated upstream
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
=======
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
>>>>>>> Stashed changes
              </div>

              <input
                type="text"
                value={techInput}
<<<<<<< Updated upstream
                onChange={(e) => setTechInput(e.target.value)}
                placeholder="Type a technology and press enter..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
=======
                onChange={(event) => setTechInput(event.target.value)}
                placeholder="Type a technology and press enter..."
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
>>>>>>> Stashed changes
                    addTech();
                  }
                }}
              />
            </div>

            <div className="project-note-box">
<<<<<<< Updated upstream
              ⓘ Once submitted, the project will be reviewed by the faculty coordinator. You will receive an email
              notification once a decision is made.
            </div>

            {error && <div className="project-form-error">{error}</div>}

            <div className="project-register-actions">
              <button type="button" className="submit-project-btn" onClick={handleSubmitForApproval}>Submit for Approval ▷</button>
              <button type="button" className="save-draft-btn">Save as Draft</button>
            </div>
          </div>
=======
              <span>ⓘ</span>
              <span>
                Once submitted, the project will be reviewed by the faculty coordinator. You will receive an email
                notification once a decision is made.
              </span>
            </div>

            <div className="project-action-row">
              <button type="button" className="submit-btn">Submit for Approval</button>
              <button type="button" className="draft-btn">Save as Draft</button>
            </div>
          </section>
>>>>>>> Stashed changes
        </div>
      </main>
    </div>
  );
};

export default ProjectRegistration;
