import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const home = user?.role === "Admin" ? "/admin" : (user?.role === "Teacher" ? "/teacher" : "/student");
  const roleLabel = user?.role === "Admin" ? "Admin" : user?.role === "Teacher" ? "Teacher" : "Student";

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to={home} className="brand">
          <span className="brand-mark">E</span>
          <span className="brand-text">Exam System</span>
        </Link>
        {user && (
          <div className="topbar-right">
            <span className="who">
              {user.fullName} · {roleLabel}
            </span>
            <button
              className="btn btn-light btn-sm"
              onClick={() => { logout(); nav("/login"); }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
