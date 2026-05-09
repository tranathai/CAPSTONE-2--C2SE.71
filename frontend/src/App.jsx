import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { useEffect } from "react";
import Login from "./pages/Login.jsx";
import StudentLayout from "./components/UI/StudentLayout.jsx";
import MentorLayout from "./components/UI/MentorLayout.jsx";
import AdminLayout from "./components/UI/AdminLayout.jsx";
import StudentDashboard from "./pages/student/Dashboard.jsx";
import StudentSubmissions from "./pages/student/Submissions.jsx";
import StudentTopic from "./pages/student/Topic.jsx";
import StudentFeedback from "./pages/student/Feedback.jsx";
import StudentTeam from "./pages/student/Team.jsx";
import StudentProfile from "./pages/student/Profile.jsx";
import StudentReview from "./pages/student/Review.jsx";
import StudentMeetings from "./pages/student/Meetings.jsx";
import StudentMessages from "./pages/student/Messages.jsx";
import MentorDashboard from "./pages/mentor/Dashboard.jsx";
import MentorSubmissions from "./pages/mentor/Submissions.jsx";
import MentorReview from "./pages/mentor/Review.jsx";
import MentorTopics from "./pages/mentor/Topics.jsx";
import MentorTeams from "./pages/mentor/Teams.jsx";
import MentorMeetings from "./pages/mentor/Meetings.jsx";
import MentorMessages from "./pages/mentor/Messages.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminUsers from "./pages/admin/Users.jsx";
import AdminTeams from "./pages/admin/Teams.jsx";
import AdminMilestones from "./pages/admin/Milestones.jsx";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (loading || !user) return;
    
    // Nếu role không khớp, navigate đến trang phù hợp
    if (!roles.includes(user.role)) {
      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "supervisor") {
        navigate("/supervisor/dashboard", { replace: true });
      } else {
        navigate("/student/dashboard", { replace: true });
      }
    }
  }, [user, roles, navigate, loading]);
  
  if (loading) return <div className="loading-screen">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return null; // Tạm thời không render gì khi đang redirect
  
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (loading || !user) return;
    
    if (user.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (user.role === "supervisor") {
      navigate("/supervisor/dashboard", { replace: true });
    } else {
      navigate("/student/dashboard", { replace: true });
    }
  }, [user, navigate, loading]);
  
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace/>;
  
  return null; // Hiển thị null khi đang redirect
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* Student routes */}
      <Route path="/student" element={
        <RequireRole roles={["student"]}><StudentLayout /></RequireRole>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="submissions" element={<StudentSubmissions />} />
        <Route path="topic" element={<StudentTopic />} />
        <Route path="feedback" element={<StudentFeedback />} />
        <Route path="team" element={<StudentTeam />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="review/:submissionId" element={<StudentReview />} />
        <Route path="meetings" element={<StudentMeetings />} />
        <Route path="messages" element={<StudentMessages />} />
        <Route path="messages/:contactId" element={<StudentMessages />} />
      </Route>

      {/* Supervisor routes */}
      <Route path="/supervisor" element={
        <RequireRole roles={["supervisor"]}><MentorLayout /></RequireRole>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<MentorDashboard />} />
        <Route path="submissions" element={<MentorSubmissions />} />
        <Route path="review/:submissionId" element={<MentorReview />} />
        <Route path="topics" element={<MentorTopics />} />
        <Route path="teams" element={<MentorTeams />} />
        <Route path="meetings" element={<MentorMeetings />} />
        <Route path="messages" element={<MentorMessages />} />
        <Route path="messages/:contactId" element={<MentorMessages />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={
        <RequireRole roles={["admin"]}><AdminLayout /></RequireRole>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="teams" element={<AdminTeams />} />
        <Route path="milestones" element={<AdminMilestones />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
