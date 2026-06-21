import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { examApi, attemptApi } from "../../api/services";
import { errMsg } from "../../utils/helpers";
import Topbar from "../../components/Topbar";
import Spinner from "../../components/Spinner";
import { useAuth } from "../../context/AuthContext";

export default function StudentHome() {
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState("exams");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const [examsRes, attemptsRes] = await Promise.all([
          examApi.available(),
          attemptApi.myAttempts()
        ]);
        setExams(examsRes.data.data || []);
        setAttempts(attemptsRes.data.data || []);
      }
      catch (e) { setErr(errMsg(e)); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <>
      <Topbar />
      <main className="container py-mobile">
        <div className="page-header">
          <div>
            <p className="text-soft mb-1 small text-uppercase" style={{ letterSpacing: ".08em" }}>Student panel</p>
            <h1 className="h3 mb-1">Exams</h1>
            <div className="d-flex flex-wrap gap-3 small">
              {user?.groupCode && (
                <span className="d-flex align-items-center gap-1">
                  <span className="text-soft">📚 Group:</span>
                  <span className="tag tag-medium">{user.groupCode}</span>
                </span>
              )}
              {user?.teacherNames && (
                <span className="d-flex align-items-center gap-1">
                  <span className="text-soft">👨‍🏫 Teacher:</span>
                  <span className="fw-medium">{user.teacherNames}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {err && <div className="alert alert-danger">{err}</div>}

        {/* Tabs */}
        <div className="tab-nav">
          <button
            className={`btn btn-sm tab-btn ${activeTab === "exams" ? "btn-primary" : "btn-light"}`}
            onClick={() => setActiveTab("exams")}
          >
            📋 Available Exams
          </button>
          <button
            className={`btn btn-sm tab-btn ${activeTab === "attempts" ? "btn-primary" : "btn-light"}`}
            onClick={() => setActiveTab("attempts")}
          >
            📊 History ({attempts.length})
          </button>
        </div>

        {/* Mövcud İmtahanlar */}
        {activeTab === "exams" && (
          loading ? <Spinner /> : exams.length === 0 ? (
            <div className="card"><div className="blank">There are currently no active exams.</div></div>
          ) : (
            <div className="exam-card-grid">
              {exams.map((e) => (
                <div className="card lift h-100" key={e.id}>
                  <div className="card-body d-flex flex-column p-3">
                    <h2 className="h5 mb-1">{e.title}</h2>
                    <p className="text-soft small flex-grow-1 mb-2">{e.description || "No description"}</p>
                    <div className="d-flex flex-wrap gap-2 small text-soft mb-3">
                      <span>📝 {e.questionCount} question(s)</span>
                      <span>⏱ {e.timeLimitMinutes} min</span>
                      <span>⭐ {e.totalPoints} pts</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small text-soft">Attempt: {e.usedAttempts}/{e.maxAttempts}</span>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={!e.canAttempt}
                        onClick={() => nav(`/student/exam/${e.id}`)}
                      >
                        {e.canAttempt ? "Start →" : "No attempts left"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* İmtahan Tarixçəsi */}
        {activeTab === "attempts" && (
          loading ? <Spinner /> : attempts.length === 0 ? (
            <div className="card"><div className="blank">You have not participated in any exams yet.</div></div>
          ) : (
            <>
              {/* Desktop cədvəl */}
              <div className="card d-none d-md-block">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th className="px-4">Exam</th>
                          <th className="text-center">Attempt No.</th>
                          <th className="text-center">Score / %</th>
                          <th className="text-center">Status</th>
                          <th>Date</th>
                          <th className="text-end px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attempts.map((a) => (
                          <tr key={a.attemptId}>
                            <td className="fw-medium px-4">{a.examTitle}</td>
                            <td className="text-center">{a.attemptNumber}</td>
                            <td className="text-center">
                              {a.status === "InProgress" ? "—" : `${a.score}/${a.maxScore} (${a.percentage}%)`}
                            </td>
                            <td className="text-center">
                              <span className={`tag ${a.status === "Submitted" ? "tag-open" : a.status === "Expired" ? "tag-hard" : "tag-medium"}`}>
                                {a.status === "Submitted" ? "Completed" : a.status === "Expired" ? "Expired" : "In Progress"}
                              </span>
                            </td>
                            <td className="small text-soft">
                              {a.submittedAt ? new Date(a.submittedAt).toLocaleString("en-US") : new Date(a.startedAt).toLocaleString("en-US")}
                            </td>
                            <td className="text-end px-4">
                              {a.status === "InProgress" ? (
                                <button className="btn btn-primary btn-sm" onClick={() => nav(`/student/exam/${a.examId}`)}>
                                  Continue
                                </button>
                              ) : (
                                <button className="btn btn-light btn-sm" onClick={() => nav(`/student/result/${a.attemptId}`)}>
                                  View Result
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Mobil kart görünüşü */}
              <div className="mobile-card-list d-md-none">
                {attempts.map((a) => (
                  <div className="mobile-card-item" key={a.attemptId}>
                    <div className="item-title">{a.examTitle}</div>
                    <div className="item-meta">
                      <span>Attempt #{a.attemptNumber}</span>
                      {a.status !== "InProgress" && (
                        <span>{a.score}/{a.maxScore} ({a.percentage}%)</span>
                      )}
                      <span>{a.submittedAt
                        ? new Date(a.submittedAt).toLocaleDateString("en-US")
                        : new Date(a.startedAt).toLocaleDateString("en-US")}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`tag ${a.status === "Submitted" ? "tag-open" : a.status === "Expired" ? "tag-hard" : "tag-medium"}`}>
                        {a.status === "Submitted" ? "Completed" : a.status === "Expired" ? "Expired" : "In Progress"}
                      </span>
                      {a.status === "InProgress" ? (
                        <button className="btn btn-primary btn-sm" onClick={() => nav(`/student/exam/${a.examId}`)}>
                          Continue
                        </button>
                      ) : (
                        <button className="btn btn-light btn-sm" onClick={() => nav(`/student/result/${a.attemptId}`)}>
                          Result
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        )}
      </main>
    </>
  );
}
