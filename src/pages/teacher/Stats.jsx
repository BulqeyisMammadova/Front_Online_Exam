import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { statsApi, attemptApi } from "../../api/services";
import { errMsg } from "../../utils/helpers";
import Topbar from "../../components/Topbar";
import Spinner from "../../components/Spinner";

export default function Stats() {
  const { id } = useParams();
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeTab, setActiveTab] = useState("results");
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, pendingRes] = await Promise.all([
          statsApi.get(id),
          statsApi.getPendingReviews(id)
        ]);
        setS(statsRes.data.data);
        setPending(pendingRes.data.data || []);
      }
      catch (e) { setErr(errMsg(e)); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const submitGrade = async (item) => {
    const points = item.gradedPoints ?? 0;
    const isCorrect = item.gradedIsCorrect ?? (points > 0);
    try {
      await attemptApi.grade(item.attemptId, [{
        answerId: item.answerId,
        pointsEarned: points,
        isCorrect: isCorrect
      }]);
      setPending(prev => prev.filter(p => p.answerId !== item.answerId));
      
      const statsRes = await statsApi.get(id);
      setS(statsRes.data.data);
    } catch (e) {
      alert(errMsg(e));
    }
  };

  // CSV download
  const csv = async () => {
    try {
      const res = await fetch(statsApi.csvUrl(id), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `results-${id}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setErr(errMsg(e)); }
  };

  if (loading) return (<><Topbar /><Spinner /></>);
  if (err) return (<><Topbar /><div className="container py-mobile"><div className="alert alert-danger">{err}</div></div></>);

  const maxCount = Math.max(1, ...s.scoreDistribution.map((b) => b.count));

  return (
    <>
      <Topbar />
      <main className="container py-mobile">
        <div className="page-header">
          <div>
            <Link to="/teacher" className="small text-soft">← Dashboard</Link>
            <h1 className="h3 mb-0 mt-1">{s.examTitle}</h1>
            <p className="text-soft mb-0 small">Results analysis</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={csv} disabled={s.totalAttempts === 0}>
              ⬇ Export CSV
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav mb-4">
          <button
            className={`btn btn-sm tab-btn ${activeTab === "results" ? "btn-primary" : "btn-light"}`}
            onClick={() => setActiveTab("results")}
          >
            📊 Results
          </button>
          <button
            className={`btn btn-sm tab-btn ${activeTab === "pending" ? "btn-primary" : "btn-light"}`}
            onClick={() => setActiveTab("pending")}
          >
            📝 Pending Review {pending.length > 0 && `(${pending.length})`}
          </button>
        </div>

        {activeTab === "results" && (
          s.totalAttempts === 0 ? (
            <div className="card"><div className="blank">Nobody has taken this exam yet.</div></div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="stats-grid mb-4">
                {[
                  ["Submissions", s.totalAttempts],
                  ["Average Score", s.averageScore],
                  ["Highest", s.highestScore],
                  ["Lowest", s.lowestScore],
                ].map(([label, val]) => (
                  <div className="card" key={label}>
                    <div className="card-body text-center py-3">
                      <div className="figure">{val}</div>
                      <div className="figure-label mt-1">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="row g-4 mb-4">
                {/* Score Distribution */}
                <div className="col-lg-7">
                  <div className="card h-100"><div className="card-body">
                    <h2 className="h6 mb-1">Score Distribution</h2>
                    <p className="text-soft small mb-0">Distribution of students by percentage ranges</p>
                    <div className="bars">
                      {s.scoreDistribution.map((b) => (
                        <div className="bar-col" key={b.range}>
                          <span className="bar-val">{b.count}</span>
                          <div className="bar" style={{ height: `${(b.count / maxCount) * 100}%` }}></div>
                          <span className="bar-label">{b.range}</span>
                        </div>
                      ))}
                    </div>
                  </div></div>
                </div>

                {/* Hardest Questions */}
                <div className="col-lg-5">
                  <div className="card h-100"><div className="card-body">
                    <h2 className="h6 mb-3">Hardest Questions</h2>
                    {s.hardestQuestions.map((q, i) => (
                      <div className="mb-3" key={q.questionId}>
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="text-truncate me-2" style={{ maxWidth: "78%" }}>{i + 1}. {q.questionText}</span>
                          <strong>{q.correctRate}%</strong>
                        </div>
                        <div className="meter">
                          <span style={{
                            width: `${q.correctRate}%`,
                            background: q.correctRate < 40 ? "#9e4b3f" : q.correctRate < 70 ? "#b5852f" : "#4f7351",
                          }}></span>
                        </div>
                      </div>
                    ))}
                  </div></div>
                </div>
              </div>

              {/* Student Results */}
              <div className="card"><div className="card-body">
                <h2 className="h6 mb-3">Student Results</h2>

                {/* Desktop Table */}
                <div className="table-responsive d-none d-md-block">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Student</th><th>Email</th>
                        <th className="text-center">Score</th><th className="text-center">Percentage</th>
                        <th className="text-center">Attempt</th><th className="text-center">Tab Switches</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.studentResults.map((r, i) => (
                        <tr key={i}>
                          <td className="fw-medium">{r.studentName}</td>
                          <td className="text-soft small">{r.email}</td>
                          <td className="text-center">{r.score}/{r.maxScore}</td>
                          <td className="text-center">
                            <span className={`tag ${r.percentage >= 50 ? "tag-open" : "tag-hard"}`}>{r.percentage}%</span>
                          </td>
                          <td className="text-center">
                            <div>{r.attemptNumber}</div>
                            {r.status === "Expired" && (
                              <div className="text-danger mt-1" style={{ fontSize: "11px", fontWeight: "600", whiteSpace: "nowrap" }}>
                                ⚠️ Səhifədən çıxıb / Yeniləyib
                              </div>
                            )}
                          </td>
                          <td className="text-center">
                            {r.tabSwitchCount > 0
                              ? <span className="tag tag-medium">{r.tabSwitchCount}</span>
                              : <span className="text-soft">0</span>}
                          </td>
                          <td className="small text-soft">
                            {r.submittedAt ? new Date(r.submittedAt).toLocaleString("en-US") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="d-md-none d-flex flex-column gap-3">
                  {s.studentResults.map((r, i) => (
                    <div className="card-quiet rounded p-3" key={i}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="fw-medium">{r.studentName}</div>
                          <div className="text-soft small">{r.email}</div>
                        </div>
                        <span className={`tag ${r.percentage >= 50 ? "tag-open" : "tag-hard"}`}>{r.percentage}%</span>
                      </div>
                      <div className="d-flex flex-wrap gap-3 small text-soft">
                        <span>Score: {r.score}/{r.maxScore}</span>
                        <span>
                          Attempt #{r.attemptNumber}
                          {r.status === "Expired" && (
                            <span className="text-danger ms-1" style={{ fontWeight: "600" }}>
                              (⚠️ Səhifədən çıxıb / Yeniləyib)
                            </span>
                          )}
                        </span>
                        {r.tabSwitchCount > 0 && <span className="text-danger">Tab: {r.tabSwitchCount}x</span>}
                        <span>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-US") : "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div></div>
            </>
          )
        )}

        {activeTab === "pending" && (
          pendingLoading ? (
            <Spinner />
          ) : pending.length === 0 ? (
            <div className="card">
              <div className="blank">🎉 No open questions awaiting review.</div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {pending.map((item) => (
                <div className="card p-3" key={item.answerId}>
                  <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                    <div>
                      <span className="tag tag-medium me-2">{item.studentName}</span>
                      <span className="text-soft small">open question response</span>
                    </div>
                    <span className="tag tag-points">{item.questionPoints} pts</span>
                  </div>

                  <div className="mb-3">
                    <div className="fw-medium mb-1 small text-soft">Question</div>
                    <div className="bg-light p-2 rounded small" style={{ whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                      {item.questionText}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="fw-medium mb-1 small text-soft">Student's Answer</div>
                    <div className="p-3 rounded small" style={{ whiteSpace: "pre-wrap", borderLeft: "4px solid var(--accent)", background: "rgba(107, 79, 58, 0.05)", lineHeight: 1.4 }}>
                      {item.answerText || <span className="text-soft fst-italic">[Student did not write an answer]</span>}
                    </div>
                  </div>

                  <div className="row g-2 align-items-end">
                    <div className="col-12 col-sm-4">
                      <label className="form-label small mb-1">Points Awarded (Maximum {item.questionPoints})</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        max={item.questionPoints}
                        value={item.gradedPoints ?? ""}
                        placeholder="Enter points..."
                        onChange={(e) => {
                          const val = e.target.value;
                          const pts = val === "" ? "" : Math.min(item.questionPoints, Math.max(0, parseInt(val) || 0));
                          setPending(prev => prev.map(p => p.answerId === item.answerId ? { 
                            ...p, 
                            gradedPoints: pts,
                            gradedIsCorrect: pts === "" ? p.gradedIsCorrect : (pts > 0)
                          } : p));
                        }}
                      />
                    </div>
                    <div className="col-12 col-sm-4">
                      <label className="form-label small mb-1 d-block">Grading</label>
                      <div className="d-flex gap-3 align-items-center mt-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name={`correct-${item.answerId}`}
                            id={`correct-yes-${item.answerId}`}
                            checked={item.gradedIsCorrect === true}
                            onChange={() => setPending(prev => prev.map(p => p.answerId === item.answerId ? { ...p, gradedIsCorrect: true } : p))}
                          />
                          <label className="form-check-label small" htmlFor={`correct-yes-${item.answerId}`}>Correct</label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name={`correct-${item.answerId}`}
                            id={`correct-no-${item.answerId}`}
                            checked={item.gradedIsCorrect === false}
                            onChange={() => setPending(prev => prev.map(p => p.answerId === item.answerId ? { ...p, gradedIsCorrect: false } : p))}
                          />
                          <label className="form-check-label small" htmlFor={`correct-no-${item.answerId}`}>Incorrect</label>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-4 text-end">
                      <button
                        className="btn btn-primary btn-sm w-100"
                        onClick={() => submitGrade(item)}
                        disabled={item.gradedPoints === undefined || item.gradedPoints === ""}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </>
  );
}
