import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { attemptApi } from "../../api/services";
import { errMsg, QTYPE } from "../../utils/helpers";
import Topbar from "../../components/Topbar";
import Spinner from "../../components/Spinner";

export default function Result() {
  const { attemptId } = useParams();
  const nav = useNavigate();
  const [r, setR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try { setR((await attemptApi.result(attemptId)).data.data); }
      catch (e) { setErr(errMsg(e)); }
      finally { setLoading(false); }
    })();
  }, [attemptId]);

  const downloadCsv = async () => {
    setErr("");
    setExporting(true);
    try {
      const res = await fetch(attemptApi.csvUrl(attemptId), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `result-${attemptId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (<><Topbar /><Spinner /></>);
  if (err && !r) return (<><Topbar /><div className="container py-mobile"><div className="alert alert-danger">{err}</div></div></>);

  const ok = r.percentage >= 50;

  return (
    <>
      <Topbar />
      <main className="container py-mobile" style={{ maxWidth: 860 }}>
        {err && <div className="alert alert-danger mb-4">{err}</div>}

        {/* Nəticə kartı */}
        <div className={`verdict ${ok ? "ok" : "no"} mb-4`}>
          <p className="text-soft small text-uppercase mb-2" style={{ letterSpacing: ".08em" }}>{r.examTitle}</p>
          <div className="score">{r.score} <span className="text-soft">/ {r.maxScore}</span></div>
          <p className="h5 mt-2 mb-1 serif">{r.percentage}%</p>
          <p className="text-soft mb-0">{r.correctCount}/{r.questionCount} correct answers</p>
          {r.hasPendingReviews && (
            <div className="alert alert-warning mt-3 mb-0 small py-2 d-inline-block">
              ⏳ Short-answer questions have not been graded by the teacher yet. Your score may increase.
            </div>
          )}

          {/* Mobil üçün aşağıda düymələr */}
          <div className="d-flex gap-2 justify-content-center mt-3 flex-wrap">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={downloadCsv}
              disabled={exporting}
            >
              {exporting ? "⏳ Loading..." : "⬇ Download CSV"}
            </button>
            <button className="btn btn-light btn-sm" onClick={() => nav("/student")}>
              ← Back to Panel
            </button>
          </div>
        </div>

        {/* Cavabların başlığı */}
        <div className="result-header mb-3">
          <h2 className="h5 mb-0">Answer Analysis</h2>
        </div>

        {/* Cavab siyahısı */}
        <div className="d-flex flex-column gap-3">
          {r.items.map((it, i) => (
            <div key={it.questionId} className={`answer-row ${it.needsReview ? "awaiting" : it.isCorrect ? "right" : "wrong"}`}>
              <div className="p-3 p-md-4">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2 flex-wrap">
                  <span className="text-soft small">Sual {i + 1} · {QTYPE[it.type]}</span>
                  {it.needsReview ? (
                    <span className="tag tag-medium">
                      ⏳ Pending teacher review · 0/{it.points}
                    </span>
                  ) : (
                    <span className={`tag ${it.isCorrect ? "tag-open" : "tag-hard"}`}>
                      {it.isCorrect
                        ? `✓ Correct · ${it.pointsEarned}/${it.points}`
                        : `✗ Incorrect · 0/${it.points}`}
                    </span>
                  )}
                </div>
                <p className="mb-3" style={{ fontWeight: 500, lineHeight: 1.5 }}>{it.questionText}</p>

                <div className="row g-2 g-md-3 small">
                  <div className="col-12 col-md-6">
                    <div className="text-soft mb-1">Your answer</div>
                    <div style={{ fontWeight: 500 }} className={it.needsReview ? "" : it.isCorrect ? "" : "text-danger"}>
                      {it.yourAnswer || <span className="text-soft fst-italic">Not answered</span>}
                    </div>
                  </div>
                  {!it.needsReview && !it.isCorrect && (
                    <div className="col-12 col-md-6">
                      <div className="text-soft mb-1">Correct answer</div>
                      <div style={{ fontWeight: 500, color: "#4f7351" }}>{it.correctAnswer}</div>
                    </div>
                  )}
                </div>

                {it.explanation && (
                  <div className="card-quiet rounded p-2 mt-3 small">
                    <strong>Explanation. </strong>{it.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Aşağı düymələr (mobil üçün əlçatan) */}
        <div className="d-flex gap-2 mt-4 flex-wrap">
          <button className="btn btn-outline-primary" onClick={downloadCsv} disabled={exporting} style={{ flex: 1 }}>
            {exporting ? "⏳ Loading..." : "⬇ Download as CSV"}
          </button>
          <button className="btn btn-light" onClick={() => nav("/student")} style={{ flex: 1 }}>
            ← Back to Panel
          </button>
        </div>
      </main>
    </>
  );
}
