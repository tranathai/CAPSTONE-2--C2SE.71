import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

const projectRows = [
  {
    id: 1,
    student: 'Alice Johnson',
    title: 'AI-Driven Waste Management',
    status: 'pending',
    date: 'Oct 24, 2023',
    action: 'Review'
  },
  {
    id: 2,
    student: 'Mark Thompson',
    title: 'Blockchain for Healthcare Records',
    status: 'risk',
    date: 'Oct 23, 2023',
    action: 'Details'
  },
  {
    id: 3,
    student: 'Sarah Chen',
    title: 'Autonomous Farming Drones',
    status: 'graded',
    date: 'Oct 22, 2023',
    action: 'View Grade'
  },
  {
    id: 4,
    student: 'David Miller',
    title: 'Smart Energy Grid Interface',
    status: 'pending',
    date: 'Oct 21, 2023',
    action: 'Review'
  }
];

const getStatusLabel = (status) => {
  if (status === 'pending') return 'Pending Review';
  if (status === 'risk') return 'At Risk';
  return 'Graded';
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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
  }, [navigate]);

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

        <button className="new-project-btn">+ New Project</button>
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
            <p className="chip good">+0% this week</p>
            <h3>Total Projects</h3>
            <strong>24</strong>
          </article>

          <article className="overview-card">
            <p className="chip warm">+20% since yesterday</p>
            <h3>Pending Reviews</h3>
            <strong>5</strong>
          </article>

          <article className="overview-card">
            <p className="chip bad">-5% from average</p>
            <h3>Projects at Risk</h3>
            <strong>2</strong>
          </article>
        </section>

        <section className="teacher-table-wrap">
          <div className="table-top">
            <h2>Recent Submissions</h2>
            <a href="#all">View All</a>
          </div>

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
              {projectRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.student}</td>
                  <td>{row.title}</td>
                  <td>
                    <span className={`status-pill ${row.status}`}>{getStatusLabel(row.status)}</span>
                  </td>
                  <td>{row.date}</td>
                  <td>
                    <button className="action-btn">{row.action}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default TeacherDashboard;