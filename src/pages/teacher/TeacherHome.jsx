import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { examApi } from "../../api/services";
import { errMsg } from "../../utils/helpers";
import Topbar from "../../components/Topbar";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";

export default function TeacherHome() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const r = await examApi.getAll();
      setExams(r.data.data || []);
    } catch (e) { setErr(errMsg(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    try { await examApi.toggleOpen(id); load(); } catch (e) { setErr(errMsg(e)); }
  };
  const del = async () => {
    try { await examApi.remove(toDelete); setToDelete(null); load(); }
    catch (e) { setErr(errMsg(e)); setToDelete(null); }
  };

  return (
    <>
      <Topbar />
      <main className="container py-mobile">
        <div className="page-header">
          <div>
            <p className="text-soft mb-1 small text-uppercase" style={{ letterSpacing: ".08em" }}>Teacher Dashboard</p>
            <h1 className="h3 mb-0">My Exams</h1>
          </div>
          <div className="page-header-actions">
            <Link to="/teacher/questions" className="btn btn-outline-primary">Question Bank</Link>
            <Link to="/teacher/exam/new" className="btn btn-primary">+ New Exam</Link>
          </div>
        </div>

        {err && <div className="alert alert-danger">{err}</div>}

        {loading ? <Spinner /> : exams.length === 0 ? (
          <div className="card"><div className="blank">
            <p className="mb-3">You don't have any exams yet.</p>
            <Link to="/teacher/exam/new" className="btn btn-primary">Create your first exam</Link>
          </div></div>
        ) : (
          <div className="exam-card-grid">
            {exams.map((e) => (
              <div className="card lift h-100" key={e.id}>
                <div className="card-body d-flex flex-column p-3">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <h2 className="h5 mb-0" style={{ flex: 1, minWidth: 0 }}>{e.title}</h2>
                    <span className={`tag ${e.isOpen ? "tag-open" : "tag-closed"}`} style={{ flexShrink: 0 }}>
                      {e.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="text-soft small flex-grow-1 mb-2">{e.description || "No description"}</p>
                  <div className="d-flex flex-wrap gap-2 small text-soft mb-3">
                    <span>📝 {e.questionCount} questions</span>
                    <span>⏱ {e.timeLimitMinutes} mins</span>
                    <span>⭐ {e.totalPoints} pts</span>
                    <span>👥 {e.attemptCount} submissions</span>
                    <span>📚 Group: {e.groupCode || "None"}</span>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button className="btn btn-light btn-sm" onClick={() => toggle(e.id)}>
                      {e.isOpen ? "🔒 Close" : "🔓 Open"}
                    </button>
                    <button className="btn btn-light btn-sm" onClick={() => nav(`/teacher/exam/${e.id}/stats`)}>
                      📊 Stats
                    </button>
                    <button className="btn btn-light btn-sm" onClick={() => nav(`/teacher/exam/${e.id}/edit`)}>
                      ✏️ Edit
                    </button>
                    <button className="btn btn-light btn-sm text-danger ms-auto" onClick={() => setToDelete(e.id)}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal open={!!toDelete} title="Delete Exam" confirmText="Delete" danger
        onConfirm={del} onClose={() => setToDelete(null)}>
        Are you sure you want to delete this exam? This action cannot be undone.
      </Modal>
    </>
  );
}
