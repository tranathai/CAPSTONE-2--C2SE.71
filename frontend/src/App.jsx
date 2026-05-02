import { useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import StudentLayout from "./components/UI/StudentLayout"; 
import MentorLayout from "./components/UI/MentorLayout"; 
import ReviewPage from "./components/Content/Mentor/ReviewPage"; 
import SubmissionsPage from "./components/Content/Student/SubmissionsPage"; 
import ProjectManagement from "./components/Content/Student/ProjectManagement"; 
import MyProjectsPage from "./components/Content/Student/MyProjectsPage"; 
import DashboardPage from "./components/Content/Student/DashboardPage"; 
import FeedbackPage from "./components/Content/Student/FeedbackPage"; 
import StudentReviewPage from "./components/Content/Student/StudentReviewPage"; 
import TeamManagementPage from "./components/Content/Student/TeamManagementPage";  // Đảm bảo import đúng TeamManagementPage
import { setRuntimeRole, useRuntimeRole } from "./config/runtimeRole";  

// Chuyển hướng trang mặc định
function HomeRedirect({ role }) {
  return (
    <Navigate
      to={role === "supervisor" ? "/mentor/submissions" : "/student/dashboard"}
      replace
    />
  );
}

// Chuyển hướng khi thay đổi vai trò (supervisor / student)
function RoleSwitchRedirect() {
  const { role } = useParams();
  const normalizedRole =
    role === "supervisor" || role === "mentor" ? "supervisor" : "student";

  useEffect(() => {
    setRuntimeRole(normalizedRole); // Lưu role vào state hoặc localStorage
  }, [normalizedRole]);

  return (
    <Navigate
      to={normalizedRole === "supervisor" ? "/mentor/submissions" : "/student/dashboard"}
      replace
    />
  );
}

function App() {
  const role = useRuntimeRole();  // Lấy role từ hook

  return (
    <Routes>
      {/* Route cho chuyển hướng role */}
      <Route path="/role/:role" element={<RoleSwitchRedirect />} />
      <Route path="/r/:role" element={<RoleSwitchRedirect />} />
      <Route path="/" element={<HomeRedirect role={role} />} /> {/* Trang chủ chuyển hướng */}

      {/* Routes cho student */}
      <Route
        path="/student"
        element={
          role === "student" ? (
            <StudentLayout />  // Hiển thị layout cho student
          ) : (
            <Navigate to="/mentor/submissions" replace />  // Nếu không phải student thì chuyển sang mentor
          )
        }
      >
        {/* Các route con của student */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="submissions" element={<MyProjectsPage />} />
        <Route path="project-management/:teamId" element={<ProjectManagement />} />
        <Route path="review/:submissionId" element={<StudentReviewPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="team" element={<TeamManagementPage />} /> {/* Đảm bảo route cho TeamManagementPage */}
      </Route>

      {/* Routes cho mentor (supervisor) */}
      <Route
        path="/mentor"
        element={
          role === "supervisor" ? (
            <MentorLayout />  // Hiển thị layout cho mentor
          ) : (
            <Navigate to="/student/dashboard" replace />  // Nếu không phải supervisor thì chuyển sang student
          )
        }
      >
        {/* Các route con của mentor */}
        <Route path="submissions" element={<SubmissionsPage />} />
        <Route path="review/:submissionId" element={<ReviewPage />} />
        <Route path="team" element={<TeamManagementPage />} />
      </Route>

      {/* Route catch-all cho các đường dẫn không hợp lệ */}
      <Route path="*" element={<HomeRedirect role={role} />} />
    </Routes>
  );
}

export default App;