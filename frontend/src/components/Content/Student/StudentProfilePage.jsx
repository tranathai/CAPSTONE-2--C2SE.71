import { useCallback, useState } from "react";
import { getProfile, updateProfile } from "../../../lib/api";
import { useAsyncResource } from "../../../hooks/useAsyncResource";
import Modal from "../../UI/Modal";
import "../../../styles/content.css";

function StudentProfilePage() {
  const loadProfile = useCallback(() => getProfile(), []);
  const { data, loading, error, reload } = useAsyncResource(loadProfile);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [openEditModal, setOpenEditModal] = useState(false);

  const profile = data || null;

  const handlePrefill = () => {
    setFullName(profile?.fullName || "");
    setPhone(profile?.phone || "");
    setOpenEditModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await updateProfile({ fullName, phone });
    setMessage("Cap nhat profile thanh cong.");
    setOpenEditModal(false);
    await reload();
  };

  return (
    <div className="submissions-page">
      <h1 className="page-title">My Profile</h1>
      <p className="page-lead">Xem va cap nhat thong tin ca nhan.</p>
      {loading ? <div className="page-status">Dang tai...</div> : null}
      {error ? <div className="form-error">{error}</div> : null}
      {profile ? (
        <div className="upload-card">
          <div><strong>Email:</strong> {profile.email}</div>
          <div><strong>Role:</strong> {profile.role}</div>
          <button className="review-btn secondary" type="button" onClick={handlePrefill}>
            Nap thong tin hien tai
          </button>
          {message ? <div className="form-success">{message}</div> : null}
        </div>
      ) : null}
      <Modal
        open={openEditModal}
        title="Cap nhat profile"
        onClose={() => setOpenEditModal(false)}
        footer={null}
      >
        <form className="feedback-form" onSubmit={handleSubmit}>
          <input className="field-control" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ho va ten" required />
          <input className="field-control" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="So dien thoai" />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" type="submit">Luu thay doi</button>
            <button className="review-btn secondary" type="button" onClick={() => setOpenEditModal(false)}>
              Huy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default StudentProfilePage;
