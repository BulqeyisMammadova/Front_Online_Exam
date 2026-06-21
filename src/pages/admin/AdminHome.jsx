import { useEffect, useState } from "react";
import { adminApi, groupApi } from "../../api/services";
import { errMsg } from "../../utils/helpers";
import Topbar from "../../components/Topbar";
import Spinner from "../../components/Spinner";

export default function AdminHome() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("users");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [groupBusy, setGroupBusy] = useState(false);

  const loadData = async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([
        adminApi.getUsers(),
        groupApi.getAll()
      ]);
      setUsers(usersRes.data.data || []);
      setGroups(groupsRes.data.data || []);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleToggleActive = async (userId, userName, currentStatus) => {
    const actStr = currentStatus ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${actStr} user "${userName}"?`)) return;
    setErr(""); setMsg("");
    try {
      const res = await adminApi.toggleActive(userId);
      setMsg(res.data.message || "User status updated successfully.");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    } catch (e) { setErr(errMsg(e)); }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setErr(""); setMsg(""); setGroupBusy(true);
    try {
      await groupApi.create({ groupCode: newGroupCode });
      setMsg(`Group "${newGroupCode}" created successfully!`);
      setNewGroupCode("");
      const res = await groupApi.getAll();
      setGroups(res.data.data || []);
    } catch (e) { setErr(errMsg(e)); } finally { setGroupBusy(false); }
  };

  const handleDeleteGroup = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete group "${code}"?`)) return;
    setErr(""); setMsg("");
    try {
      await groupApi.remove(id);
      setMsg(`Group "${code}" deleted successfully.`);
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (e) { setErr(errMsg(e)); }
  };

  const filteredUsers = users.filter(u => {
    const nameMatch = `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
                      u.email.toLowerCase().includes(search.toLowerCase());
    const roleMatch = roleFilter === "All" || u.role === roleFilter;
    return nameMatch && roleMatch;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    teachers: users.filter(u => u.role === "Teacher").length,
    students: users.filter(u => u.role === "Student").length,
  };

  return (
    <>
      <Topbar />
      <main className="container py-mobile">
        <div className="mb-4">
          <p className="text-soft mb-1 small text-uppercase" style={{ letterSpacing: ".08em" }}>Management Dashboard</p>
          <h1 className="h3 mb-1">Admin Dashboard</h1>
          <p className="text-soft small mb-0">Manage all users and groups.</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid mb-4">
          <div className="card p-3 text-center">
            <div className="figure">{stats.total}</div>
            <div className="figure-label">Total</div>
          </div>
          <div className="card p-3 text-center">
            <div className="figure" style={{ color: "#4f7351" }}>{stats.active}</div>
            <div className="figure-label">Active</div>
          </div>
          <div className="card p-3 text-center">
            <div className="figure" style={{ color: "#8a6418" }}>{stats.teachers}</div>
            <div className="figure-label">Teacher</div>
          </div>
          <div className="card p-3 text-center">
            <div className="figure" style={{ color: "#5a6e7a" }}>{stats.students}</div>
            <div className="figure-label">Student</div>
          </div>
          <div className="card p-3 text-center">
            <div className="figure" style={{ color: "#6a5acd" }}>{groups.length}</div>
            <div className="figure-label">Group</div>
          </div>
        </div>

        {err && <div className="alert alert-danger">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}

        {/* Tab Navigation */}
        <div className="tab-nav mb-4">
          <button
            className={`btn btn-sm tab-btn ${activeTab === "users" ? "btn-primary" : "btn-light"}`}
            onClick={() => setActiveTab("users")}
          >
            👥 Users ({users.length})
          </button>
          <button
            className={`btn btn-sm tab-btn ${activeTab === "groups" ? "btn-primary" : "btn-light"}`}
            onClick={() => setActiveTab("groups")}
          >
            📚 Groups ({groups.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <>
            <div className="card p-3 mb-4">
              <div className="row g-2">
                <div className="col-12 col-md-8">
                  <label className="form-label">Search</label>
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Name, surname or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="All">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Student">Student</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <Spinner />
            ) : filteredUsers.length === 0 ? (
              <div className="card"><div className="blank">No users found.</div></div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="card d-none d-md-block">
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr>
                            <th className="px-4">User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Group</th>
                            <th>Status</th>
                            <th className="text-end px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u) => {
                            const fullName = `${u.firstName} ${u.lastName}`;
                            const groupDisplay = u.role === "Student"
                              ? (u.groupCode || "—")
                              : u.role === "Teacher"
                                ? (u.groupCodes?.join(", ") || "—")
                                : "—";
                            return (
                              <tr key={u.id}>
                                <td className="fw-medium px-4">{fullName}</td>
                                <td className="text-soft small">{u.email}</td>
                                <td>
                                  <span className={`tag ${u.role === "Admin" ? "tag-points" : u.role === "Teacher" ? "tag-medium" : "tag-type"}`}>
                                    {u.role === "Admin" ? "Admin" : u.role === "Teacher" ? "Teacher" : "Student"}
                                  </span>
                                </td>
                                <td className="small text-soft">{groupDisplay}</td>
                                <td>
                                  <span className={`tag ${u.isActive ? "tag-open" : "tag-hard"}`}>
                                    {u.isActive ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td className="text-end px-4">
                                  {u.role === "Admin" ? (
                                    <span className="text-soft small fst-italic">Cannot be modified</span>
                                  ) : (
                                    <button
                                      className={`btn btn-sm ${u.isActive ? "btn-light" : "btn-primary"}`}
                                      onClick={() => handleToggleActive(u.id, fullName, u.isActive)}
                                    >
                                      {u.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="d-md-none">
                  <p className="small text-soft mb-2">{filteredUsers.length} users found</p>
                  <div className="d-flex flex-column gap-3">
                    {filteredUsers.map((u) => {
                      const fullName = `${u.firstName} ${u.lastName}`;
                      const groupDisplay = u.role === "Student"
                        ? (u.groupCode || "—")
                        : u.role === "Teacher"
                          ? (u.groupCodes?.join(", ") || "—")
                          : "—";
                      return (
                        <div className="user-card-mobile" key={u.id}>
                          <div className="user-card-header">
                            <div>
                              <div className="user-name">{fullName}</div>
                              <div className="user-email">{u.email}</div>
                              {groupDisplay !== "—" && (
                                <div className="small text-soft mt-1">📚 {groupDisplay}</div>
                              )}
                            </div>
                            <span className={`tag ${u.isActive ? "tag-open" : "tag-hard"}`}>
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className={`tag ${u.role === "Admin" ? "tag-points" : u.role === "Teacher" ? "tag-medium" : "tag-type"}`}>
                              {u.role === "Admin" ? "Admin" : u.role === "Teacher" ? "Teacher" : "Student"}
                            </span>
                            {u.role !== "Admin" && (
                              <button
                                  className={`btn btn-sm ${u.isActive ? "btn-light" : "btn-primary"}`}
                                onClick={() => handleToggleActive(u.id, fullName, u.isActive)}
                              >
                                {u.isActive ? "Deactivate" : "Activate"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Groups Tab */}
        {activeTab === "groups" && (
          <>
            {/* Create Group */}
            <div className="card p-4 mb-4">
              <h2 className="h6 mb-3 fw-semibold">Create New Group</h2>
              <form onSubmit={handleCreateGroup} className="d-flex gap-2 align-items-end">
                <div className="flex-grow-1">
                  <label className="form-label">Group Code</label>
                  <input
                    className="form-control"
                    placeholder="E.g., IT101, P324, SE205"
                    value={newGroupCode}
                    onChange={e => setNewGroupCode(e.target.value)}
                    pattern="^[a-zA-Z0-9]+$"
                    title="Alphanumeric only"
                    required
                  />
                  <small className="text-soft">Alphanumeric only (e.g., IT101, P324)</small>
                </div>
                <button className="btn btn-primary" disabled={groupBusy} style={{ height: "38px" }}>
                  {groupBusy ? "…" : "+ Create"}
                </button>
              </form>
            </div>

            {/* Groups List */}
            {groups.length === 0 ? (
              <div className="card"><div className="blank">No groups found.</div></div>
            ) : (
              <div className="card">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th className="px-4">Group Code</th>
                          <th className="text-center">Students Count</th>
                          <th className="text-center">Teachers Count</th>
                          <th className="text-end px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups.map(g => (
                          <tr key={g.id}>
                            <td className="fw-semibold px-4">
                              <span className="tag tag-medium">{g.groupCode}</span>
                            </td>
                            <td className="text-center">{g.studentCount}</td>
                            <td className="text-center">{g.teacherCount}</td>
                            <td className="text-end px-4">
                              <button
                                className="btn btn-sm btn-light"
                                onClick={() => handleDeleteGroup(g.id, g.groupCode)}
                                disabled={g.studentCount > 0 || g.teacherCount > 0}
                                title={g.studentCount > 0 || g.teacherCount > 0 ? "Group with students/teachers cannot be deleted" : "Delete"}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
