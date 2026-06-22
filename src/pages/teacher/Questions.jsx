import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { questionApi } from "../../api/services";
import { errMsg, QTYPE, DIFF, DIFF_TAG } from "../../utils/helpers";
import Topbar from "../../components/Topbar";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";

const blank = {
  id: null, text: "", type: 1, difficulty: 2, points: 1,
  explanation: "", correctAnswerText: "",
  options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }],
};

export default function Questions() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blank);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await questionApi.getAll(); setList(r.data.data || []); }
    catch (e) { setErr(errMsg(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const pickType = (t) => {
    t = Number(t);
    let options = f.options;
    if (t === 2) options = [{ text: "True", isCorrect: false }, { text: "False", isCorrect: false }];
    else if (t === 1 && f.type !== 1) options = [{ text: "", isCorrect: false }, { text: "", isCorrect: false }];
    setF({ ...f, type: t, options });
  };

  const setOpt = (i, field, val) => {
    const options = [...f.options];
    if (field === "isCorrect") {
      if (f.type === 2) options.forEach((o, idx) => (o.isCorrect = idx === i));
      else options[i].isCorrect = val;
    } else options[i][field] = val;
    setF({ ...f, options });
  };

  const startNew = () => { setF(blank); setErr(""); setOpen(true); };

  const startEdit = async (id) => {
    try {
      const r = await questionApi.getById(id);
      const q = r.data.data;
      setF({
        id: q.id, text: q.text, type: q.type, difficulty: q.difficulty, points: q.points,
        explanation: q.explanation || "", correctAnswerText: q.correctAnswerText || "",
        options: q.options?.length ? q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
          : [{ text: "", isCorrect: false }, { text: "", isCorrect: false }],
      });
      setErr(""); setOpen(true);
    } catch (e) { setErr(errMsg(e)); }
  };

  const save = async (e) => {
    e.preventDefault(); setErr("");
    if (!f.text.trim()) return setErr("Question text cannot be empty");
    if (f.type === 3) {
      if (!f.correctAnswerText.trim()) return setErr("Type the correct answer");
    } else {
      if (f.options.some((o) => !o.text.trim())) return setErr("Fill in all options");
      if (!f.options.some((o) => o.isCorrect)) return setErr("Select at least one correct option");
    }
    const payload = {
      ...(f.id ? { id: f.id } : {}),
      text: f.text, type: +f.type, difficulty: +f.difficulty, points: +f.points,
      explanation: f.explanation,
      correctAnswerText: f.type === 3 ? f.correctAnswerText : null,
      options: f.type === 3 ? [] : f.options,
    };
    setBusy(true);
    try {
      f.id ? await questionApi.update(payload) : await questionApi.create(payload);
      setOpen(false); load();
    } catch (e) { setErr(errMsg(e)); }
    finally { setBusy(false); }
  };

  const del = async () => {
    try { await questionApi.remove(toDelete); setToDelete(null); load(); }
    catch (e) { setErr(errMsg(e)); setToDelete(null); }
  };

  return (
    <>
      <Topbar />
      <main className="container py-4 py-md-5">
        <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-3">
          <div>
            <Link to="/teacher" className="small text-soft">← Dashboard</Link>
            <h1 className="h3 mb-0 mt-1">Question Bank</h1>
          </div>
          <button className="btn btn-primary" onClick={startNew}>New Question</button>
        </div>

        {err && !open && <div className="alert alert-danger">{err}</div>}

        {loading ? <Spinner /> : list.length === 0 ? (
          <div className="card"><div className="blank">
            <p className="mb-3">Your question bank is empty.</p>
            <button className="btn btn-primary" onClick={startNew}>Add your first question</button>
          </div></div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {list.map((q) => (
              <div className="card" key={q.id}>
                <div className="card-body py-3 d-flex justify-content-between align-items-start gap-3">
                  <div>
                    <div className="d-flex gap-2 mb-2 flex-wrap">
                      <span className="tag tag-type">{QTYPE[q.type]}</span>
                      <span className={`tag ${DIFF_TAG[q.difficulty]}`}>{DIFF[q.difficulty]}</span>
                      <span className="tag tag-points">{q.points} points</span>
                    </div>
                    <p className="mb-0">{q.text}</p>
                  </div>
                  <div className="d-flex gap-2 flex-none">
                    <button className="btn btn-light btn-sm" onClick={() => startEdit(q.id)}>Edit</button>
                    <button className="btn btn-light btn-sm text-danger" onClick={() => setToDelete(q.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Question Form */}
      {open && (
        <>
          <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <form onSubmit={save} className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title h6 mb-0">{f.id ? "Edit Question" : "New Question"}</h5>
                  <button type="button" className="btn-close" onClick={() => setOpen(false)}></button>
                </div>
                <div className="modal-body">
                  {err && <div className="alert alert-danger py-2 small">{err}</div>}

                  <div className="mb-3">
                    <label className="form-label">Question Text</label>
                    <textarea className="form-control" rows={2} value={f.text}
                      onChange={(e) => setF({ ...f, text: e.target.value })} required />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Type</label>
                      <select className="form-select" value={f.type} onChange={(e) => pickType(e.target.value)}>
                        <option value={1}>Multiple Choice</option>
                        <option value={2}>True/False</option>
                        <option value={3}>Short Answer</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Difficulty</label>
                      <select className="form-select" value={f.difficulty}
                        onChange={(e) => setF({ ...f, difficulty: e.target.value })}>
                        <option value={1}>Easy</option>
                        <option value={2}>Medium</option>
                        <option value={3}>Hard</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Points</label>
                      <input type="number" min={1} max={100} className="form-control" value={f.points}
                        onChange={(e) => setF({ ...f, points: e.target.value })} />
                    </div>
                  </div>

                  {f.type === 3 ? (
                    <div className="mb-3">
                      <label className="form-label">Correct Answer</label>
                      <input className="form-control" value={f.correctAnswerText}
                        onChange={(e) => setF({ ...f, correctAnswerText: e.target.value })}
                        placeholder="Expected answer text" />
                      <small className="text-soft">Case-insensitive</small>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label mb-0">Options</label>
                        {f.type === 1 && (
                          <button type="button" className="btn btn-light btn-sm py-0"
                            onClick={() => setF({ ...f, options: [...f.options, { text: "", isCorrect: false }] })}>
                            + Option
                          </button>
                        )}
                      </div>
                      {f.options.map((o, i) => (
                        <div className="input-group mb-2" key={i}>
                          <span className="input-group-text">
                            <input type={f.type === 2 ? "radio" : "checkbox"} name="correct"
                              checked={o.isCorrect} onChange={(e) => setOpt(i, "isCorrect", e.target.checked)} />
                          </span>
                          <input className="form-control" value={o.text} disabled={f.type === 2}
                            onChange={(e) => setOpt(i, "text", e.target.value)} placeholder={`Option ${i + 1}`} />
                          {f.type === 1 && f.options.length > 2 && (
                            <button type="button" className="btn btn-light"
                              onClick={() => setF({ ...f, options: f.options.filter((_, x) => x !== i) })}>×</button>
                          )}
                        </div>
                      ))}
                      <small className="text-soft">Check correct option(s) using the box on the left</small>
                    </div>
                  )}

                  <div>
                    <label className="form-label">Explanation <span className="text-soft">(optional)</span></label>
                    <textarea className="form-control" rows={2} value={f.explanation}
                      onChange={(e) => setF({ ...f, explanation: e.target.value })}
                      placeholder="Will be displayed on result page" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setOpen(false)}>Cancel</button>
                  <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      <Modal open={!!toDelete} title="Delete Question" confirmText="Delete" danger
        onConfirm={del} onClose={() => setToDelete(null)}>
        Are you sure you want to delete this question?
      </Modal>
    </>
  );
}
