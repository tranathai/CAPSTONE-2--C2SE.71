import { useEffect, useState } from "react";

import {
  Trash2,
  Users,
  Plus,
  Pencil,
} from "lucide-react";

import {
  getGroups,
  createGroup,
  deleteGroup,
  getStudents,
  getMentors,
  updateGroup,
} from "../../../lib/api";

import "../../../styles/groupManagement.css";

function GroupManagementPage() {
  const [groups, setGroups] = useState([]);

  const [allStudents, setAllStudents] = useState([]);

  const [allMentors, setAllMentors] = useState([]);

  const [open, setOpen] = useState(false);

  const [editingGroup, setEditingGroup] =
    useState(null);

  const [showStudentList, setShowStudentList] =
    useState(false);

  const [name, setName] = useState("");

  const [topicTitle, setTopicTitle] =
    useState("");

  const [mentorId, setMentorId] = useState("");

  const [students, setStudents] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const groupData = await getGroups();

      const studentData = await getStudents();

      const mentorData = await getMentors();

      setGroups(groupData || []);

      setAllStudents(studentData || []);

      setAllMentors(mentorData || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreate() {
    try {
      const emails = students
        .split(",")
        .map((e) => e.trim());

      const matchedStudents =
        allStudents.filter((s) =>
          emails.includes(s.email)
        );

      const studentIds = matchedStudents.map(
        (s) => s.id
      );

      await createGroup({
        name,
        supervisor_id: Number(mentorId),
        topic_title: topicTitle,
        studentIds,
      });

      closeModal();

      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdate() {
    try {
      const emails = students
        .split(",")
        .map((e) => e.trim());

      const matchedStudents =
        allStudents.filter((s) =>
          emails.includes(s.email)
        );

      const studentIds = matchedStudents.map(
        (s) => s.id
      );

      await updateGroup(editingGroup.id, {
        name,
        supervisor_id: Number(mentorId),
        topic_title: topicTitle,
        studentIds,
      });

      closeModal();

      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Xóa nhóm này?")) return;

    try {
      await deleteGroup(id);

      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  function closeModal() {
    setOpen(false);

    setEditingGroup(null);

    setName("");

    setTopicTitle("");

    setMentorId("");

    setStudents("");
  }

  return (
    <div className="gm-container">
      <div className="gm-header">
        <div>
          <h1>Quản lý nhóm</h1>
          <p>Quản lý mentor và sinh viên</p>
        </div>

        <button
          className="gm-create-btn"
          onClick={() => setOpen(true)}
        >
          <Plus size={18} />
          Tạo nhóm
        </button>
      </div>

      <div className="gm-grid">
        {groups.map((g) => (
          <div key={g.id} className="gm-card">
            <div className="gm-card-header">
              <h2>{g.name}</h2>

              <div>
                <Pencil
                  size={18}
                  className="edit"
                  onClick={() => {
                    setEditingGroup(g);

                    setName(g.name || "");

                    setTopicTitle(
                      g.topic_title || ""
                    );

                    setMentorId(
                      g.supervisor_id || ""
                    );

                    setStudents(
                      g.member_emails
                        ? g.member_emails.join(", ")
                        : ""
                    );

                    setOpen(true);
                  }}
                />

                <Trash2
                  size={18}
                  className="delete"
                  onClick={() =>
                    handleDelete(g.id)
                  }
                />
              </div>
            </div>

            <p className="gm-topic">
              📘 {g.topic_title || "Chưa có đề tài"}
            </p>

            <p className="gm-mentor">
              👨‍🏫 Mentor:
              {g.mentor_name || "Chưa có"}
            </p>

            <p className="gm-leader">
              ⭐ Leader:
              {g.leader_name || "Chưa có"}
            </p>

            <div className="gm-members">
              <div className="gm-member-count">
                <Users size={16} />
                {g.total_members} thành viên
              </div>

              <div className="gm-member-list">
                {g.members?.map((m, i) => (
                  <div
                    key={i}
                    className="gm-member-item"
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="gm-modal">
          <div className="gm-modal-box">
            <h3>
              {editingGroup
                ? "Chỉnh sửa nhóm"
                : "Tạo nhóm mới"}
            </h3>

            <label>Tên nhóm *</label>

            <input
              placeholder="Nhập tên nhóm"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

            <label>Tên đề tài</label>

            <input
              placeholder="Nhập tên đề tài"
              value={topicTitle}
              onChange={(e) =>
                setTopicTitle(e.target.value)
              }
            />

            <label>Chọn mentor *</label>

            <select
              value={mentorId}
              onChange={(e) =>
                setMentorId(e.target.value)
              }
            >
              <option value="">
                Chọn mentor
              </option>

              {allMentors.map((m) => (
                <option
                  key={m.id}
                  value={m.id}
                >
                  {m.name}
                </option>
              ))}
            </select>

            <label>Email sinh viên *</label>

            <textarea
              rows={4}
              placeholder="Nhập email, cách nhau dấu phẩy"
              value={students}
              onChange={(e) =>
                setStudents(e.target.value)
              }
            />

            <small>
              Sinh viên đầu tiên sẽ là nhóm
              trưởng
            </small>

            <button
              className="gm-show-students"
              onClick={() =>
                setShowStudentList(
                  !showStudentList
                )
              }
            >
              ▼ Xem danh sách email sinh viên
            </button>

            {showStudentList && (
              <div className="gm-student-list-box">
                {allStudents.map((s) => (
                  <div key={s.id}>
                    <strong>{s.name}:</strong>{" "}
                    {s.email}
                  </div>
                ))}
              </div>
            )}

            <div className="gm-modal-actions">
              <button
                onClick={
                  editingGroup
                    ? handleUpdate
                    : handleCreate
                }
              >
                {editingGroup
                  ? "Lưu thay đổi"
                  : "Tạo nhóm"}
              </button>

              <button onClick={closeModal}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupManagementPage;