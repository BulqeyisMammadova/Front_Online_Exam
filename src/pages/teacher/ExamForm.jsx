import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { examApi, questionApi, groupApi } from "../../api/services";
import { errMsg, QTYPE, DIFF, DIFF_TAG } from "../../utils/helpers";
import Topbar from "../../components/Topbar";
import Spinner from "../../components/Spinner";

export default function ExamForm() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [picked, setPicked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({
    title: "", description: "", timeLimitMinutes: 30, maxAttempts: 1, shuffleQuestions: true, groupId: ""
  });

  useEffect(() => {
    (async () => {
      try {
        const [qRes, gRes] = await Promise.all([
          questionApi.getAll(),
          groupApi.getAll()
        ]);
        setQuestions(qRes.data.data || []);
        setGroups(gRes.data.data || []);
        if (editing) {
          const e = (await examApi.getById(id)).data.data;
          setF({
            title: e.title, description: e.description || "",
            timeLimitMinutes: e.timeLimitMinutes, maxAttempts: e.maxAttempts,
            shuffleQuestions: e.shuffleQuestions, groupId: e.groupId || ""
          });
          setPicked(e.questions.map((x) => x.id));
        }
      } catch (e) { setErr(errMsg(e)); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const toggle = (qid) =>
    setPicked((p) => (p.includes(qid) ? p.filter((x) => x !== qid) : [...p, qid]));

  const points = questions.filter((q) => picked.includes(q.id)).reduce((s, q) => s + q.points, 0);

  const save = async (e) => {
    e.preventDefault(); setErr("");
    if (!f.title.trim()) return setErr("Title cannot be empty");
    if (!f.groupId) return setErr("Please select a group");
    if (picked.length === 0) return setErr("Select at least one question");
    const payload = {
      ...(editing ? { id } : {}),
      title: f.title, description: f.description,
      timeLimitMinutes: +f.timeLimitMinutes, maxAttempts: +f.maxAttempts,
      shuffleQuestions: f.shuffleQuestions, groupId: f.groupId, questionIds: picked,
    };
    setBusy(true);
    try {
      editing ? await examApi.update(payload) : await examApi.create(payload);
      nav("/teacher");
    } catch (e) { setErr(errMsg(e)); }
    finally { setBusy(false); }
  };

  if (loading) return (<><Topbar /><Spinner /></>);

  return (
    <>
      <Topbar />
      <main className="container py-mobile">
        <div className="mb-3">
          <Link to="/teacher" className="small text-soft">← Dashboard</Link>
          <h1 className="h3 mb-0 mt-1">{editing ? "Edit Exam" : "New Exam"}</h1>
        </div>

        {err && <div className="alert alert-danger">{err}</div>}

        <form onSubmit={save}>
          <div className="row g-3">
            {/* Parameters */}
            <div className="col-lg-4 order-lg-2">
              <div className="card">
                <div className="card-body">
                  <h2 className="h6 mb-3">Settings</h2>
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input className="form-control" value={f.title}
                      onChange={(e) => setF({ ...f, title: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={2} value={f.description}
                      onChange={(e) => setF({ ...f, description: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Target Group</label>
                    <select
                      className="form-control"
                      value={f.groupId}
                      onChange={(e) => setF({ ...f, groupId: e.target.value })}
                      required
                    >
                      <option value="">-- Select Group --</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.groupCode}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label">Time (mins)</label>
                      <input type="number" min={1} max={600} className="form-control"
                        value={f.timeLimitMinutes} onChange={(e) => setF({ ...f, timeLimitMinutes: e.target.value })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Attempts Limit</label>
                      <input type="number" min={1} max={50} className="form-control"
                        value={f.maxAttempts} onChange={(e) => setF({ ...f, maxAttempts: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="sh"
                      checked={f.shuffleQuestions}
                      onChange={(e) => setF({ ...f, shuffleQuestions: e.target.checked })} />
                    <label className="form-check-label small" htmlFor="sh">Shuffle questions</label>
                  </div>
                  <div className="card-quiet rounded p-2 mb-3 small text-center">
                    <strong>{picked.length}</strong> questions · <strong>{points}</strong> points
                  </div>
                  <button className="btn btn-primary w-100" disabled={busy}>
                    {busy ? "Saving…" : editing ? "Save" : "Create"}
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-8 order-lg-1">
              <div className="card">
                <div className="card-body">
                  <h2 className="h6 mb-3">Select from question bank</h2>
                  {questions.length === 0 ? (
                    <div className="blank">
                      <p>Question bank is empty.</p>
                      <Link to="/teacher/questions" className="btn btn-primary btn-sm">Add a question</Link>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: "62vh", overflowY: "auto" }}>
                      {questions.map((q) => {
                        const on = picked.includes(q.id);
                        return (
                          <div key={q.id} className={`choice ${on ? "picked" : ""}`} onClick={() => toggle(q.id)}>
                            <span className="dot"></span>
                            <div>
                              <div className="d-flex gap-2 mb-1 flex-wrap">
                                <span className="tag tag-type">{QTYPE[q.type]}</span>
                                <span className={`tag ${DIFF_TAG[q.difficulty]}`}>{DIFF[q.difficulty]}</span>
                                <span className="tag tag-points">{q.points} points</span>
                              </div>
                              <span>{q.text}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
