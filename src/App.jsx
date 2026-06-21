import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Guard from "./components/Guard";

import Login from "./pages/Login";
import Register from "./pages/Register";
import TeacherHome from "./pages/teacher/TeacherHome";
import Questions from "./pages/teacher/Questions";
import ExamForm from "./pages/teacher/ExamForm";
import Stats from "./pages/teacher/Stats";
import StudentHome from "./pages/student/StudentHome";
import Exam from "./pages/student/Exam";
import Result from "./pages/student/Result";
import AdminHome from "./pages/admin/AdminHome";

export default function App() {
  const { user } = useAuth();
  const home = user ? (user.role === "Admin" ? "/admin" : (user.role === "Teacher" ? "/teacher" : "/student")) : "/login";

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/admin" element={<Guard role="Admin"><AdminHome /></Guard>} />

      <Route path="/teacher" element={<Guard role="Teacher"><TeacherHome /></Guard>} />
      <Route path="/teacher/questions" element={<Guard role="Teacher"><Questions /></Guard>} />
      <Route path="/teacher/exam/new" element={<Guard role="Teacher"><ExamForm /></Guard>} />
      <Route path="/teacher/exam/:id/edit" element={<Guard role="Teacher"><ExamForm /></Guard>} />
      <Route path="/teacher/exam/:id/stats" element={<Guard role="Teacher"><Stats /></Guard>} />

      <Route path="/student" element={<Guard role="Student"><StudentHome /></Guard>} />
      <Route path="/student/exam/:examId" element={<Guard role="Student"><Exam /></Guard>} />
      <Route path="/student/result/:attemptId" element={<Guard role="Student"><Result /></Guard>} />

      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}
