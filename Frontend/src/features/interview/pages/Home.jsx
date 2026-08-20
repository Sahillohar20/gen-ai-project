import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInterview } from "../hooks/useInterview.js";
import "../style/home.scss";

const Home = () => {
  const { loading, generateReport, reports, deleteReport } = useInterview();
  const safeReports = Array.isArray(reports) ? reports : [];
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const resumeInputRef = useRef(null);
  const navigate = useNavigate();

  const handleGenerateReport = async () => {
    const resumeFile = resumeInputRef.current?.files?.[0];

    if (!jobDescription.trim() && !selfDescription.trim() && !resumeFile) {
      window.alert(
        "Please provide a job description, upload a resume, or enter a self-description."
      );
      return;
    }

    try {
      const data = await generateReport({
        jobDescription,
        selfDescription,
        resumeFile
      });

      if (!data?._id) {
        throw new Error("The server did not return a valid interview report.");
      }

      navigate(`/interview/${data._id}`);
    } catch (error) {
      console.error("Failed to generate interview report:", error);
      window.alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to generate interview report."
      );
    }
  };

  if (loading) {
    return (
      <main className="loading-screen">
        <h1>Loading your interview plan...</h1>
      </main>
    );
  }

  return (
    <div className="home-page">
      <header className="page-header">
        <h1>
          Create Your Custom <span className="highlight">Interview Plan</span>
        </h1>
        <p>
          Let our AI analyze the job requirements and your unique profile to
          build a winning strategy.
        </p>
      </header>

      <div className="interview-card">
        <div className="interview-card__body">
          <div className="panel panel--left">
            <div className="panel__header">
              <h2>Target Job Description</h2>
              <span className="badge badge--required">Required</span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              className="panel__textarea"
              placeholder="Paste the full job description here..."
              maxLength={5000}
            />
            <div className="char-counter">
              {String(jobDescription ?? "").length} / 5000 chars
            </div>
          </div>

          <div className="panel-divider" />

          <div className="panel panel--right">
            <div className="panel__header">
              <h2>Your Profile</h2>
            </div>

            <div className="upload-section">
              <label className="section-label" htmlFor="resume">
                Upload Resume
                <span className="badge badge--best">Best Results</span>
              </label>
              <label className="dropzone" htmlFor="resume">
                <p className="dropzone__title">Click to upload or drag &amp; drop</p>
                <p className="dropzone__subtitle">PDF or DOCX (Max 5MB)</p>
                <input
                  ref={resumeInputRef}
                  hidden
                  type="file"
                  id="resume"
                  name="resume"
                  accept=".pdf,.docx"
                />
              </label>
            </div>

            <div className="or-divider">
              <span>OR</span>
            </div>

            <div className="self-description">
              <label className="section-label" htmlFor="selfDescription">
                Quick Self-Description
              </label>
              <textarea
                value={selfDescription}
                onChange={(event) => setSelfDescription(event.target.value)}
                id="selfDescription"
                name="selfDescription"
                className="panel__textarea panel__textarea--short"
                placeholder="Briefly describe your experience and key skills..."
              />
            </div>

            <div className="info-box">
              <p>
                Either a <strong>Resume</strong> or a <strong>Self Description</strong> is
                required to generate a personalized plan.
              </p>
            </div>
          </div>
        </div>

        <div className="interview-card__footer">
          <span className="footer-info">AI-Powered Strategy Generation</span>
          <button onClick={handleGenerateReport} className="generate-btn">
            Generate My Interview Strategy
          </button>
        </div>
      </div>

      {safeReports.length > 0 && (
        <section className="recent-reports">
          <h2>My Recent Interview Plans</h2>
          <ul className="reports-list">
            {safeReports.map((report) => (
              <li
                key={report._id ?? report.id}
                className="report-item"
                onClick={() => navigate(`/interview/${report._id ?? report.id}`)}
              >
                <div className="report-item__content">
                  <h3>{report.title || "Untitled Position"}</h3>
                  <p>
                    Generated on {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                  <p className="match-score">Match Score: {report.matchScore}%</p>
                </div>
                <button
                  type="button"
                  className="delete-report-btn"
                  onClick={async (event) => {
                    event.stopPropagation();
                    const reportId = report._id ?? report.id;

                    if (!window.confirm("Delete this interview plan?")) {
                      return;
                    }

                    try {
                      await deleteReport(reportId);
                    } catch (error) {
                      console.error("Failed to delete interview report:", error);
                      window.alert(
                        error.response?.data?.message ||
                          "Failed to delete interview plan."
                      );
                    }
                  }}
                  aria-label={`Delete ${report.title || "interview plan"}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="page-footer">
        <a href="#privacy">Privacy Policy</a>
        <a href="#terms">Terms of Service</a>
        <a href="#help">Help Center</a>
      </footer>
    </div>
  );
};

export default Home;

