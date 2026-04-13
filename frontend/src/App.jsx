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
>>>>>>> tuyet

function App() {
  const role = useRuntimeRole();

  return (
<<<<<<< HEAD
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
          role === "student" ? (
            <StudentLayout />
          ) : (
            <Navigate to="/mentor/submissions" replace />
          )
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="submissions" element={<MyProjectsPage />} />
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

      <Route path="*" element={<HomeRedirect role={role} />} />
    </Routes>
  );
}

export default App;
