import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { groupApi } from "../api/services";
import { errMsg } from "../utils/helpers";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [groups, setGroups] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    groupApi.getAll().then(res => setGroups(res.data.data || [])).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const u = await login(email, password, groupCode);
      nav(u.role === "Admin" ? "/admin" : (u.role === "Teacher" ? "/teacher" : "/student"));
    } catch (e) {
      setErr(errMsg(e));
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="seal">E</div>
        <h2 className="text-center h4 mb-1">Welcome Back</h2>
        <p className="text-center text-soft mb-4">Log in to the exam system</p>

        <div className="card p-4">
          {err && <div className="alert alert-danger py-2 small">{err}</div>}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={email}
                onChange={(e) => setEmail(e.target.value)} required placeholder="name@exam.com" />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="form-label">
                Group Code{" "}
                <span className="text-soft small">(Not required for Admin)</span>
              </label>
              <select
                className="form-select"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
              >
                <option value="">— Select (Leave empty if Admin) —</option>
                {groups.map(g => (
                  <option key={g.id} value={g.groupCode}>{g.groupCode}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary w-100" disabled={busy}>
              {busy ? "Logging in…" : "Log In"}
            </button>
          </form>
        </div>
        <p className="text-center text-soft mt-3 mb-0 small">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
