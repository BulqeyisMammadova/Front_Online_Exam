import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { attemptApi } from "../../api/services";
import { errMsg, fmtTime, QTYPE } from "../../utils/helpers";
import Spinner from "../../components/Spinner";
import Modal from "../../components/Modal";

export default function Exam() {
  const { examId } = useParams();
  const nav = useNavigate();

  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [at, setAt] = useState(0);
  const [left, setLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [guard, setGuard] = useState(false);
  const [switches, setSwitches] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const done = useRef(false);
  const attemptId = useRef(null);
  const submitRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const d = (await attemptApi.start(examId)).data.data;
        setData(d);
        attemptId.current = d.attemptId;
        const ends = new Date(d.endsAt).getTime();
        setLeft(Math.max(0, Math.floor((ends - Date.now()) / 1000)));
      } catch (e) { setErr(errMsg(e)); }
      finally { setLoading(false); }
    })();
  }, [examId]);

  const submit = useCallback(async () => {
    if (done.current) return;
    done.current = true;
    setSending(true);
    const payload = {
      attemptId: attemptId.current,
      answers: Object.entries(answers).map(([questionId, a]) => ({
        questionId,
        selectedOptionId: a.selectedOptionId || null,
        answerText: a.answerText || null,
      })),
    };
    try {
      await attemptApi.submit(payload);
      nav(`/student/result/${attemptId.current}`);
    } catch (e) { setErr(errMsg(e)); setSending(false); done.current = false; }
  }, [answers, nav]);

  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  useEffect(() => {
    if (loading || !data) return;
    if (left <= 0) { submit(); return; }
    const t = setInterval(() => setLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [left, loading, data, submit]);

  useEffect(() => {
    if (!data) return;
    const onHide = () => {
      if (document.hidden && !done.current) {
        attemptApi.tabSwitch(attemptId.current).catch(() => {});
        submitRef.current();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const block = (e) => e.preventDefault();
    ["contextmenu", "copy", "cut", "paste"].forEach((ev) => document.addEventListener(ev, block));
    return () => ["contextmenu", "copy", "cut", "paste"].forEach((ev) => document.removeEventListener(ev, block));
  }, [data]);

  useEffect(() => {
    const h = (e) => { if (!done.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  const pick = (qid, oid) => setAnswers((p) => ({ ...p, [qid]: { selectedOptionId: oid } }));
  const type = (qid, t) => setAnswers((p) => ({ ...p, [qid]: { answerText: t } }));
  const answered = (q) => {
    const a = answers[q.questionId];
    if (!a) return false;
    return q.type === 3 ? !!a.answerText?.trim() : !!a.selectedOptionId;
  };

  if (loading) return <Spinner text="Preparing exam..." />;
  if (err && !data) return (
    <div className="container py-mobile">
      <div className="alert alert-danger">{err}</div>
      <button className="btn btn-primary" onClick={() => nav("/student")}>Back</button>
    </div>
  );

  const q = data.questions[at];
  const cnt = data.questions.filter(answered).length;
  const tcls = left < 30 ? "danger" : left < 120 ? "warn" : "";
  const total = data.questions.length;

  return (
    <div className="noselect" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Üst zolaq */}
      <div className="exam-topbar">
        <div className="exam-topbar-inner">
          <div style={{ minWidth: 0 }}>
            <div className="exam-title">{data.title}</div>
            <div className="exam-meta">Attempt #{data.attemptNumber} · {cnt}/{total} answered</div>
          </div>
          <div className={`timer ${tcls}`}>{fmtTime(left)}</div>
        </div>

        {/* Mobil progress bar */}
        <div style={{ height: 3, background: "#e7dccb" }}>
          <div style={{
            height: "100%",
            width: `${((at + 1) / total) * 100}%`,
            background: "#6b4f3a",
            transition: "width 0.3s ease"
          }} />
        </div>
      </div>

      {/* Əsas məzmun */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="container py-mobile">
          {err && <div className="alert alert-danger mb-3">{err}</div>}

          {/* Desktop layout */}
          <div className="d-none d-lg-flex gap-4">
            {/* Sual paneli */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <QuestionCard
                q={q} at={at} total={total}
                answers={answers} pick={pick} type={type}
                onPrev={() => setAt((c) => c - 1)}
                onNext={() => setAt((c) => c + 1)}
                onFinish={() => setConfirm(true)}
              />
            </div>

            {/* Palitra - desktop */}
            <div style={{ width: 220, flexShrink: 0 }}>
              <PaletteCard
                questions={data.questions} at={at} answered={answered}
                cnt={cnt} onSelect={setAt} onFinish={() => setConfirm(true)}
                switches={switches}
              />
            </div>
          </div>

          {/* Mobil layout */}
          <div className="d-lg-none">
            {/* Palitra toggle */}
            <button
              className="palette-toggle"
              onClick={() => setPaletteOpen(!paletteOpen)}
            >
              <span>📋 Questions ({cnt}/{total} answered)</span>
              <span>{paletteOpen ? "▲" : "▼"}</span>
            </button>

            {paletteOpen && (
              <div className="card mb-3">
                <div className="card-body pb-2">
                  <div className="palette mb-3">
                    {data.questions.map((qq, i) => (
                      <button key={qq.questionId}
                        className={`pal-btn ${i === at ? "here" : ""} ${answered(qq) ? "done" : ""}`}
                        onClick={() => { setAt(i); setPaletteOpen(false); }}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <div className="small text-soft d-flex gap-3 mb-1">
                    <span><span className="legend-swatch" style={{ background: "rgba(79,115,81,.14)", borderColor: "#4f7351" }}></span> Answered ({cnt})</span>
                    <span><span className="legend-swatch"></span> Remaining ({total - cnt})</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sual kartı */}
            <QuestionCard
              q={q} at={at} total={total}
              answers={answers} pick={pick} type={type}
              onPrev={() => setAt((c) => c - 1)}
              onNext={() => setAt((c) => c + 1)}
              onFinish={() => setConfirm(true)}
            />
          </div>
        </div>
      </div>

      {/* Mobil alt naviqasiya */}
      <div className="exam-bottom-nav">
        <button className="btn btn-light" disabled={at === 0} onClick={() => setAt((c) => c - 1)}>
          ← Previous
        </button>
        {at < total - 1 ? (
          <button className="btn btn-primary" onClick={() => setAt((c) => c + 1)}>
            Next →
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setConfirm(true)}>
            Finish ✓
          </button>
        )}
      </div>

      <Modal open={confirm} title="Finish Exam" confirmText={sending ? "Submitting..." : "Yes, finish"}
        onConfirm={submit} onClose={() => setConfirm(false)}>
        <p className="mb-2">Are you sure you want to submit?</p>
        <div className="card-quiet rounded p-2 small">
          Answered: <strong>{cnt}</strong> / {total}
          {cnt < total && (
            <div className="text-danger mt-1">{total - cnt} question(s) not answered.</div>
          )}
        </div>
      </Modal>

      {guard && (
        <div className="guard">
          <div>
            <h2 className="serif" style={{ color: "#f3ece1" }}>Warning</h2>
            <p className="mb-1">Leaving the exam page is prohibited.</p>
            <p className="mb-4 opacity-75">This action has been recorded.</p>
            <button className="btn btn-light" onClick={() => setGuard(false)}>Back to Exam</button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ q, at, total, answers, pick, type, onPrev, onNext, onFinish }) {
  return (
    <div className="card">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex justify-content-between text-soft small mb-3">
          <span>Question {at + 1} / {total}</span>
          <span>{QTYPE[q.type]} · {q.points} pts</span>
        </div>
        <h2 className="h5 mb-4" style={{ lineHeight: 1.5 }}>{q.text}</h2>

        {q.type === 3 ? (
          <textarea
            className="form-control"
            rows={3}
            placeholder="Write your answer"
            value={answers[q.questionId]?.answerText || ""}
            onChange={(e) => type(q.questionId, e.target.value)}
            style={{ resize: "vertical" }}
          />
        ) : (
          q.options.map((o) => {
            const on = answers[q.questionId]?.selectedOptionId === o.optionId;
            return (
              <div key={o.optionId} className={`choice ${on ? "picked" : ""}`}
                onClick={() => pick(q.questionId, o.optionId)}>
                <span className="dot"></span>
                <span style={{ flex: 1, lineHeight: 1.4 }}>{o.text}</span>
              </div>
            );
          })
        )}

        {/* Desktop naviqasiya düymələri (card içində) */}
        <div className="d-none d-lg-flex justify-content-between mt-4 pt-3 hairline">
          <button className="btn btn-light" disabled={at === 0} onClick={onPrev}>← Previous</button>
          {at < total - 1 ? (
            <button className="btn btn-primary" onClick={onNext}>Next →</button>
          ) : (
            <button className="btn btn-primary" onClick={onFinish}>Finish Exam</button>
          )}
        </div>
      </div>
    </div>
  );
}

function PaletteCard({ questions, at, answered, cnt, onSelect, onFinish, switches }) {
  return (
    <div className="card">
      <div className="card-body">
        <h3 className="h6 mb-3">Questions</h3>
        <div className="palette mb-3">
          {questions.map((qq, i) => (
            <button key={qq.questionId}
              className={`pal-btn ${i === at ? "here" : ""} ${answered(qq) ? "done" : ""}`}
              onClick={() => onSelect(i)}>{i + 1}</button>
          ))}
        </div>
        <div className="small text-soft d-flex flex-column gap-1 mb-3">
          <span><span className="legend-swatch" style={{ background: "rgba(79,115,81,.14)", borderColor: "#4f7351" }}></span> Answered ({cnt})</span>
          <span><span className="legend-swatch"></span> Remaining ({questions.length - cnt})</span>
        </div>
        <button className="btn btn-primary w-100" onClick={onFinish}>Finish Exam</button>
        {switches > 0 && (
          <p className="small text-danger mt-3 mb-0">
            You left the page {switches} time(s) — recorded.
          </p>
        )}
      </div>
    </div>
  );
}
