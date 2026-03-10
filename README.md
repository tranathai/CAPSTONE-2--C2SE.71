# CAPSTONE-2--C2SE.71
MentorAI Grad
Project Management System with AI-Assisted Feedback

MentorAI Grad is a web-based platform designed to support the management and supervision of capstone projects between students and supervisors. The system centralizes project topic approval, milestone tracking, report submission, and supervisor feedback. It also integrates AI to summarize supervisor feedback and highlight key revision points for students.

Project Overview

Managing capstone projects often involves fragmented communication, unclear progress tracking, and manual document handling. MentorAI Grad addresses these challenges by providing a centralized system where students and supervisors can collaborate effectively throughout the capstone project lifecycle.

The platform allows students to propose project topics, submit milestone reports, and track progress. Supervisors can review submissions, provide feedback, and monitor student progress through dashboards.

To improve learning efficiency, the system integrates AI-assisted summarization to help students quickly understand supervisor feedback.

Key Features
User Management

User registration and login

Role-based access control (Student, Supervisor, Admin)

Profile management

Project Topic Management

Students propose capstone project topics

Supervisors review and approve or reject topics

Milestone Management

Supervisors define project milestones and deadlines

Students track project progress

Submission & Document Management

Students upload milestone reports

Supervisors review submissions

Support resubmission if required

Feedback System

Supervisors provide written feedback

Students view and respond to feedback

Progress Monitoring

Dashboard displaying project progress

Milestone completion status

AI-Assisted Feedback Summarization

Uses external AI service (Gemini API)

Summarizes supervisor feedback

Highlights key revision points

System Architecture

The system follows a three-tier web architecture:

Client (ReactJS Frontend)
        │
REST API (NodeJS / Express Backend)
        │
Database (MySQL)
        │
External AI Service (Gemini API)
Components

Frontend

ReactJS

TailwindCSS

Backend

NodeJS

ExpressJS

Database

MySQL

External Services

Gemini API (AI feedback summarization)

Technology Stack

Frontend

ReactJS

TailwindCSS

Backend

NodeJS

ExpressJS

Database

MySQL

AI Integration

Gemini API

Development Tools

Git / GitHub

Postman

VSCode

System Roles
Student

Register and log in

Propose project topics

Submit milestone reports

View supervisor feedback

Track project progress

Supervisor

Review and approve project topics

Define project milestones

Review submissions

Provide feedback

Administrator

Manage users and system roles

Monitor system activity

Database Overview

Main entities:

Users
Projects
Milestones
Submissions
Feedback
Notifications
Roles

The database is normalized to reduce redundancy and improve query performance.

Installation Guide
1. Clone repository
git clone https://github.com/your-repo/mentorai-grad.git
2. Install backend dependencies
cd backend
npm install
3. Install frontend dependencies
cd frontend
npm install
4. Configure environment variables

Create .env file in backend folder:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=mentorai_grad
GEMINI_API_KEY=your_api_key
JWT_SECRET=your_secret_key
5. Run backend server
npm run dev
6. Run frontend
npm start
Future Improvements

Real-time notifications for milestones

Advanced analytics dashboard

Integration with university learning management systems

Enhanced AI-assisted project guidance

Development Team

Capstone Project Team

Project Leader / Scrum Master

Backend Developer

Frontend Developer

System Architect

International School
Duy Tan University

License

This project is developed for academic purposes as part of the Capstone Project course.
