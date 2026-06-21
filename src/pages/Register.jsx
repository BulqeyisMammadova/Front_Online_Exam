import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { groupApi } from "../api/services";
import { errMsg } from "../utils/helpers";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", password: "", role: "Student", groupCode: "", groupCodes: [] });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    groupApi.getAll().then(res => setGroups(res.data.data || [])).catch(() => {});
  }, []);

  const ch = (e) => {
    const { name, value } = e.target;
    if (name === "role") {
      setF({ ...f, role: value, groupCode: "", groupCodes: [] });
    } else {
      setF({ ...f, [name]: value });
    }
  };

  const toggleGroupCode = (code) => {
    setF(prev => ({
      ...prev,
      groupCodes: prev.groupCodes.includes(code)
        ? prev.groupCodes.filter(c => c !== code)
        : [...prev.groupCodes, code]
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setOk(""); setBusy(true);
    try {
      await register(f);
      setOk("Registration completed. Please log in.");
      setTimeout(() => nav("/login"), 1200);
    } catch (e) {
      setErr(errMsg(e));
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="seal">E</div>
        <h2 className="text-center h4 mb-1">Create an Account</h2>
        <p className="text-center text-soft mb-4">Join as a teacher or a student</p>

        <div className="card p-4">
          {err && <div className="alert alert-danger py-2 small">{err}</div>}
          {ok && <div className="alert alert-success py-2 small">{ok}</div>}
          <form onSubmit={submit}>
            <div className="row g-2 mb-3">
              <div className="col">
                <label className="form-label">First Name</label>
                <input name="firstName" className="form-control" value={f.firstName} onChange={ch} required />
              </div>
              <div className="col">
                <label className="form-label">Last Name</label>
                <input name="lastName" className="form-control" value={f.lastName} onChange={ch} required />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input name="email" type="email" className="form-control" value={f.email} onChange={ch} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input name="password" type="password" className="form-control" value={f.password}
                onChange={ch} required minLength={6} />
              <small className="text-soft">At least 6 characters, upper/lowercase and number</small>
            </div>
            <div className="mb-3">
              <label className="form-label">Role</label>
              <select name="role" className="form-select" value={f.role} onChange={ch}>
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
              </select>
            </div>

            {/* Student group selection */}
            {f.role === "Student" && (
              <div className="mb-4">
                <label className="form-label">
                  Group Code <span className="text-danger">*</span>
                </label>
                <select name="groupCode" className="form-select" value={f.groupCode} onChange={ch} required>
                  <option value="">— Select Group —</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.groupCode}>{g.groupCode}</option>
                  ))}
                </select>
                <small className="text-soft">You can only belong to 1 group</small>
              </div>
            )}

            {/* Teacher group selection */}
            {f.role === "Teacher" && (
              <div className="mb-4">
                <label className="form-label">
                  Groups <span className="text-danger">*</span>
                </label>
                {groups.length === 0 ? (
                  <p className="text-soft small">No groups found</p>
                ) : (
                  <div className="d-flex flex-wrap gap-2 mt-1">
                    {groups.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGroupCode(g.groupCode)}
                        className={`btn btn-sm ${f.groupCodes.includes(g.groupCode) ? "btn-primary" : "btn-light"}`}
                      >
                        {g.groupCode}
                      </button>
                    ))}
                  </div>
                )}
                {f.groupCodes.length > 0 && (
                  <small className="text-soft d-block mt-2">Selected: {f.groupCodes.join(", ")}</small>
                )}
                <small className="text-soft d-block">You can select multiple groups</small>
              </div>
            )}

            <button className="btn btn-primary w-100" disabled={busy}>
              {busy ? "Registering…" : "Register"}
            </button>
          </form>
        </div>
        <p className="text-center text-soft mt-3 mb-0 small">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}
