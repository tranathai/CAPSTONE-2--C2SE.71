import { useState } from "react";
import { submitTeacherRequest } from "../../../lib/api";
import "../../../styles/content.css";

function BecomeInstructorPage() {
  const [cvFile, setCvFile] = useState(null);
  const [degreeFile, setDegreeFile] = useState(null);
  const [experienceText, setExperienceText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!cvFile || !degreeFile || !experienceText.trim()) {
      setError("Vui long dien day du CV, bang cap va kinh nghiem.");
      return;
    }
    const formData = new FormData();
    formData.append("cvFile", cvFile);
    formData.append("degreeFile", degreeFile);
    formData.append("experienceText", experienceText.trim());
    try {
      setLoading(true);
      await submitTeacherRequest(formData);
      setMessage("Gui yeu cau thanh cong. Admin se duyet qua dashboard hoac magic link email.");
      setCvFile(null);
      setDegreeFile(null);
      setExperienceText("");
    } catch (apiError) {
      setError(apiError.message || "Khong the gui yeu cau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submissions-page">
      <h1 className="page-title">Become an Instructor</h1>
      <p className="page-lead">Gui ho so de tro thanh giang vien huong dan.</p>
      <form className="upload-card" onSubmit={handleSubmit}>
        <label className="field-label">
          CV (PDF)
          <input className="field-control" type="file" accept=".pdf" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
        </label>
        <label className="field-label">
          Bang cap (PDF/JPG/PNG)
          <input className="field-control" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDegreeFile(e.target.files?.[0] || null)} />
        </label>
        <label className="field-label">
          Mo ta kinh nghiem
          <textarea
            className="mentor-feedback-textarea"
            rows={5}
            value={experienceText}
            onChange={(e) => setExperienceText(e.target.value)}
            placeholder="Mo ta kinh nghiem huong dan, mon hoc, du an da lam..."
          />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        {message ? <div className="form-success">{message}</div> : null}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Dang gui..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}

export default BecomeInstructorPage;
