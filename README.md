# 🚀 MentorAI Grad

### Capstone Project Management System with AI-Assisted Feedback

MentorAI Grad is a web-based system designed to support the management and supervision of capstone projects between students and supervisors. The platform centralizes project topic approval, milestone tracking, report submission, and feedback management, with AI-assisted summarization to improve understanding of supervisor comments.

---

# 📌 Project Overview

Managing capstone projects often involves fragmented communication, unclear progress tracking, and manual document handling. MentorAI Grad addresses these challenges by providing a centralized platform where students and supervisors can collaborate effectively throughout the project lifecycle.

The system supports the full workflow:

```text
Topic Proposal → Approval → Milestones → Submission → Feedback → AI Summary → Dashboard
```

---

# ✨ Key Features

## 👤 User Management

* User registration and login
* Role-based access control (Student, Supervisor, Admin)
* JWT authentication and session management

## 📘 Project Topic Management

* Students propose capstone project topics
* Supervisors review and approve/reject topics
* Each team is assigned one project

## 📅 Milestone Management

* Automatic creation of milestones after project approval:

  * Proposal
  * Midterm
  * Final
* Deadlines are generated based on project start date

## 📤 Submission Management

* Students submit reports for each milestone
* Support multiple submission versions
* File upload and storage via URL

## 💬 Feedback System

* Supervisors provide feedback on submissions
* Students can review and improve based on comments

## 🤖 AI-Assisted Feedback Summarization

* Integration with Gemini API
* Summarizes supervisor feedback
* Highlights key revision points

## 📊 Progress Dashboard

* Track milestone completion status
* Identify overdue submissions
* Monitor overall project progress

## 🔔 Notification System

* Deadline reminders
* Feedback notifications
* Submission confirmation alerts

---

# 🏗️ System Architecture

The system follows a **three-tier architecture**:

```text
Frontend (ReactJS)
        │
Backend (NodeJS / Express API)
        │
Database (MySQL)
        │
External AI Service (Gemini API)
```

---

# 🛠️ Technology Stack

## Backend

* Node.js
* Express.js
* MySQL
* JWT (Authentication)
* bcrypt (Password hashing)

## Frontend

* ReactJS (Vite)
* React Router DOM
* Axios

## Database

* MySQL (Relational Database)

## AI Integration

* Gemini API (Feedback summarization)

## Tools

* Git / GitHub
* Postman
* VS Code

---

# 👥 System Roles

## Student

* Register and log in
* Propose project topics
* Submit milestone reports
* View feedback and AI summaries
* Track project progress

## Supervisor

* Review and approve/reject topics
* Define and monitor milestones
* Provide feedback
* Track student progress

## Administrator

* Manage user accounts
* Monitor system activities

---

# 🗄️ Database Design (Overview)

Main entities:

```text
Users
Teams
Team_Members
Projects
Milestones
Submissions
Feedbacks
Notifications
```

## Relationships

```text
Users
   │
   ├── Team_Members
   │        │
   │        └── Teams
   │              │
   │              └── Projects
   │                      │
   │                      └── Milestones
   │                              │
   │                              └── Submissions
   │                                      │
   │                                      └── Feedbacks
```

✔ Database is normalized to **3NF**
✔ Optimized for query performance

---

# 🔄 System Workflow

```text
1. Student proposes project topic
2. Supervisor reviews and approves/rejects
3. System auto-generates milestones
4. Student submits milestone reports
5. Supervisor provides feedback
6. AI summarizes feedback
7. Dashboard updates progress
```

---

# 📡 API Endpoints (Core)

## 🔐 Authentication

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

## 📘 Project

```
POST   /api/projects
GET    /api/projects/pending
PUT    /api/projects/:id/approve
PUT    /api/projects/:id/reject
```

## 📅 Milestone

```
GET    /api/milestones/:projectId
```

## 📤 Submission

```
POST   /api/submissions
GET    /api/submissions/:milestoneId
```

## 💬 Feedback

```
POST   /api/feedback
GET    /api/feedback/:submissionId
```

---

# 📁 Project Structure

```text
mentorai-grad/
│
├── backend/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── config/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── context/
│
├── database/
│   └── schema.sql
│
├── docs/
│   ├── architecture/
│   ├── erd/
│   └── diagrams/
│
└── README.md
```

---

# ⚙️ Installation Guide

## 1. Clone repository

```bash
git clone https://github.com/your-repo/mentorai-grad.git
```

---

## 2. Setup Backend

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mentorai_grad
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_api_key
```

Run backend:

```bash
npm run dev
```

---

## 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 🔐 Security

* Password hashing using bcrypt
* JWT-based authentication
* Role-based access control (RBAC)
* File validation for uploads

---

# 🚀 Future Improvements

* Real-time notifications (WebSocket)
* Advanced analytics dashboard
* Integration with LMS systems
* Enhanced AI recommendations
* Mobile application

---

# 👨‍💻 Development Team

Capstone Project Team - MentorAI Grad
Duy Tan University

---

# 📄 License

This project is developed for academic purposes.

---

# 🏁 Final Note

This system focuses on delivering a **stable MVP** with:

* Clean architecture
* Clear workflow
* Practical AI integration

---
