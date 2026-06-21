import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

export default function Guard({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    const dest = user.role === "Admin" ? "/admin" : (user.role === "Teacher" ? "/teacher" : "/student");
    return <Navigate to={dest} replace />;
  }
  return children;
}
