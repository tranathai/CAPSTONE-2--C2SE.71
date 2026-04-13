import { useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import StudentLayout from "./components/UI/StudentLayout";
import MentorLayout from "./components/UI/MentorLayout";
import RoleSelection from "./pages/RoleSelection";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ProjectRegistration from "./pages/ProjectRegistration";
import ReviewPage from "./components/Content/Mentor/ReviewPage";
import SubmissionsPage from "./components/Content/Student/SubmissionsPage";
import ProjectManagement from "./components/Content/Student/ProjectManagement";
import DashboardPage from "./components/Content/Student/DashboardPage";
import FeedbackPage from "./components/Content/Student/FeedbackPage";
import StudentReviewPage from "./components/Content/Student/StudentReviewPage";
import { setRuntimeRole, useRuntimeRole } from "./config/runtimeRole";
function HomeRedirect({ role }) {
  return (
    <Navigate
      to={role === "supervisor" ? "/mentor/submissions" : "/student/dashboard"}
      replace
    />
  );
}

function RoleSwitchRedirect() {
  const { role } = useParams();
  const normalizedRole =
    role === "supervisor" || role === "mentor" ? "supervisor" : "student";

  useEffect(() => {
    setRuntimeRole(normalizedRole);
  }, [normalizedRole]);

  return (
    <Navigate
      to={normalizedRole === "supervisor" ? "/mentor/submissions" : "/student/dashboard"}
      replace
    />
  );
}

function App() {
  const role = useRuntimeRole();

  return (
    <Routes>
      <Route path="/" element={<RoleSelection />} />
      <Route path="/login/:role" element={<Login />} />
      <Route path="/register/:role" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/myproject/*" element={<Dashboard />} />
      <Route path="/student/feedback" element={<Dashboard />} />
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/project/ProjectRegistration" element={<ProjectRegistration />} />

      <Route path="/role/:role" element={<RoleSwitchRedirect />} />
      <Route path="/r/:role" element={<RoleSwitchRedirect />} />
      <Route path="/home" element={<HomeRedirect role={role} />} />

      <Route
        path="/student"
        element={
          role === "student" ? (
            <StudentLayout />
          ) : (
            <Navigate to="/mentor/submissions" replace />
          )
        }
      >
        <Route path="dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="submissions" element={<Navigate to="/myproject" replace />} />
        <Route path="project-management/:teamId" element={<ProjectManagement />} />
        <Route path="review/:submissionId" element={<StudentReviewPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
      </Route>

      <Route
        path="/mentor"
        element={
          role === "supervisor" ? (
            <MentorLayout />
          ) : (
            <Navigate to="/student/dashboard" replace />
          )
        }
      >
        <Route path="submissions" element={<SubmissionsPage />} />
        <Route path="review/:submissionId" element={<ReviewPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
