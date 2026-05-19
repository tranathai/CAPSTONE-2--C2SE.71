import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "/api" : "http://localhost:5000/api");

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401 (skip failed login/register — those must show inline errors, not full reload)
function isPublicAuthRequest(config) {
  const path = `${config?.baseURL || ""}${config?.url || ""}`;
  return /\/auth\/(login|register)\b/.test(path);
}

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !isPublicAuthRequest(err.config)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

function body(data) {
  if (data && Object.prototype.hasOwnProperty.call(data, "data")) return data.data;
  if (data?.success === false) throw new Error(data.message || "API error");
  return data;
}

export function getApiErrorMessage(err, fallback = "API error") {
  return err?.response?.data?.message || err?.message || fallback;
}

export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  (import.meta.env.DEV ? "http://localhost:5000" : "http://localhost:5000");

// ─── Auth ────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email, password) => client.post("/auth/login", { email, password }).then((r) => body(r.data)),
  me: () => client.get("/auth/me").then((r) => body(r.data)),
  logout: () => client.post("/auth/logout").then((r) => body(r.data)),
};

// ─── Users ──────────────────────────────────────────────────────────────────
export const users = {
  me: () => client.get("/users/me").then((r) => body(r.data)),
  updateProfile: (data) => client.put("/users/me", data).then((r) => body(r.data)),
  changePassword: (data) => client.put("/users/me/password", data).then((r) => body(r.data)),
  list: (params) => client.get("/users", { params }).then((r) => body(r.data)),
  create: (data) => client.post("/users", data).then((r) => body(r.data)),
  importCsv: (rows) => client.post("/users/import-csv", { rows }).then((r) => body(r.data)),
  changeRole: (userId, role) => client.put(`/users/${userId}/role`, { role }).then((r) => body(r.data)),
  toggleStatus: (userId, is_active) => client.put(`/users/${userId}/status`, { is_active }).then((r) => body(r.data)),
};

// ─── Teams ──────────────────────────────────────────────────────────────────
export const teams = {
  myTeam: () => client.get("/teams/me").then((r) => body(r.data)),
  joined: () => client.get("/teams/joined").then((r) => body(r.data)),
  list: (params) => client.get("/teams", { params }).then((r) => body(r.data)),
  semesterBusyStudents: (semester, excludeTeamId) =>
    client
      .get("/teams/semester-busy-students", {
        params: {
          semester,
          ...(excludeTeamId != null && excludeTeamId !== "" ? { exclude_team_id: excludeTeamId } : {}),
        },
      })
      .then((r) => body(r.data)),
  get: (id) => client.get(`/teams/${id}`).then((r) => body(r.data)),
  supervisees: () => client.get("/teams/supervisees").then((r) => body(r.data)),
  create: (data) => client.post("/teams", data).then((r) => body(r.data)),
  update: (id, data) => client.put(`/teams/${id}`, data).then((r) => body(r.data)),
  remove: (id) => client.delete(`/teams/${id}`).then((r) => body(r.data)),
  addMember: (teamId, userId, isLeader) => client.post(`/teams/${teamId}/members`, { user_id: userId, is_leader: isLeader }).then((r) => body(r.data)),
  removeMember: (teamId, userId) => client.delete(`/teams/${teamId}/members`, { data: { user_id: userId } }).then((r) => body(r.data)),
  setLeader: (teamId, leaderUserId) =>
    client.patch(`/teams/${teamId}/leader`, { leader_user_id: leaderUserId }).then((r) => body(r.data)),
};

// ─── Milestones ─────────────────────────────────────────────────────────────
export const milestones = {
  list: (params) => client.get("/milestones", { params }).then((r) => body(r.data)),
  upcoming: (limit) => client.get("/milestones/upcoming", { params: { limit } }).then((r) => body(r.data)),
  get: (id) => client.get(`/milestones/${id}`).then((r) => body(r.data)),
  create: (data) => client.post("/milestones", data).then((r) => body(r.data)),
  update: (id, data) =>
    client.put(`/milestones/${id}`, data).then((r) => {
      const d = r.data;
      if (d?.success === false) throw new Error(d.message || "API error");
      return d;
    }),
  remove: (id) => client.delete(`/milestones/${id}`).then((r) => body(r.data)),
  batchList: () => client.get("/milestones/batches").then((r) => body(r.data)),
  createBatch: (data) => client.post("/milestones/batches", data).then((r) => body(r.data)),
  updateBatch: (id, data) => client.put(`/milestones/batches/${id}`, data).then((r) => body(r.data)),
  removeBatch: (id) => client.delete(`/milestones/batches/${id}`).then((r) => body(r.data)),
};

// ─── Topics ─────────────────────────────────────────────────────────────────
export const topics = {
  register: (data) => client.post("/topics/register", data).then((r) => body(r.data)),
  myTopic: () => client.get("/topics/my").then((r) => body(r.data)),
  removeMyTopic: (teamId) =>
    client.delete("/topics/my", { data: teamId != null && teamId !== "" ? { team_id: teamId } : {} }).then((r) => body(r.data)),
  pending: () => client.get("/topics/pending").then((r) => body(r.data)),
  approve: (id, milestoneIds) => client.put(`/topics/${id}/approve`, { milestone_ids: milestoneIds }).then((r) => body(r.data)),
  reject: (id, reason) => client.put(`/topics/${id}/reject`, { reason }).then((r) => body(r.data)),
  approved: () => client.get("/topics/approved").then((r) => body(r.data)),
};

// ─── Submissions ────────────────────────────────────────────────────────────
export const submissions = {
  list: (params) => client.get("/submissions", { params }).then((r) => body(r.data)),
  my: () => client.get("/submissions/my").then((r) => body(r.data)),
  myByTeam: (teamId) => client.get(`/submissions/my/team/${teamId}`).then((r) => body(r.data)),
  supervisor: (teamId) =>
    client
      .get("/submissions/supervisor", {
        params: teamId != null && teamId !== "" ? { team_id: teamId } : {},
      })
      .then((r) => body(r.data)),
  stats: () => client.get("/submissions/stats").then((r) => body(r.data)),
  get: (id) => client.get(`/submissions/${id}`).then((r) => body(r.data)),
  upload: (formData) => client.post("/submissions/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => body(r.data)),
  studentUpload: (formData) =>
    client.post("/submissions/student/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => {
      const d = r.data;
      if (d?.success === false) throw new Error(d.message || "API error");
      return d;
    }),
  studentUploadVersion: (formData) => client.post("/submissions/student/upload-version", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => body(r.data)),
  update: (id, data) => client.put(`/submissions/${id}`, data).then((r) => body(r.data)),
  deleteVersion: (versionId) => client.delete(`/submissions/version/${versionId}`).then((r) => body(r.data)),
  remove: (id) => client.delete(`/submissions/${id}`).then((r) => body(r.data)),
  byMilestone: (teamId, milestoneId) => client.get(`/submissions/team/${teamId}/milestone/${milestoneId}`).then((r) => body(r.data)),
};

// ─── Feedbacks ─────────────────────────────────────────────────────────────
export const feedbacks = {
  byVersion: (versionId) => client.get(`/feedbacks/version/${versionId}`).then((r) => body(r.data)),
  create: (data) => client.post("/feedbacks", data).then((r) => body(r.data)),
  update: (id, data) => client.put(`/feedbacks/${id}`, data).then((r) => body(r.data)),
};

// ─── Notifications ─────────────────────────────────────────────────────────
export const notifications = {
  list: (params) => client.get("/notifications", { params }).then((r) => body(r.data)),
  unreadCount: () => client.get("/notifications/unread-count").then((r) => body(r.data)),
  markRead: (id) => client.put(`/notifications/${id}/read`).then((r) => body(r.data)),
  markAllRead: () => client.put("/notifications/read-all").then((r) => body(r.data)),
};

// ─── Meetings ──────────────────────────────────────────────────────────────
export const meetings = {
  list: () => client.get("/meetings").then((r) => body(r.data)),
  upcoming: (limit) => client.get("/meetings/upcoming", { params: { limit } }).then((r) => body(r.data)),
  get: (id) => client.get(`/meetings/${id}`).then((r) => body(r.data)),
  create: (data) => client.post("/meetings", data).then((r) => body(r.data)),
  update: (id, data) => client.put(`/meetings/${id}`, data).then((r) => body(r.data)),
  remove: (id) => client.delete(`/meetings/${id}`).then((r) => body(r.data)),
  request: (data) => client.post("/meetings/request", data).then((r) => body(r.data)),
  supervisorRequests: () => client.get("/meetings/requests/supervisor").then((r) => body(r.data)),
  studentRequests: () => client.get("/meetings/requests").then((r) => body(r.data)),
  approveRequest: (id, data) => client.put(`/meetings/request/${id}/approve`, data).then((r) => body(r.data)),
  declineRequest: (id, reason) => client.put(`/meetings/request/${id}/decline`, { reason }).then((r) => body(r.data)),
};

// ─── Messages ──────────────────────────────────────────────────────────────
export const messages = {
  contacts: () => client.get("/messages/contacts").then((r) => body(r.data)),
  conversation: (userId, params) => client.get(`/messages/conversation/${userId}`, { params }).then((r) => body(r.data)),
  unreadCount: () => client.get("/messages/unread-count").then((r) => body(r.data)),
  send: (data) => client.post("/messages", data).then((r) => body(r.data)),
  groups: () => client.get("/messages/groups").then((r) => body(r.data)),
  groupMessages: (teamId, params) => client.get(`/messages/groups/${teamId}`, { params }).then((r) => body(r.data)),
  sendGroup: (data) => client.post("/messages/groups/send", data).then((r) => body(r.data)),
  updateGroupMessage: (messageId, data) =>
    client.put(`/messages/groups/message/${messageId}`, data).then((r) => body(r.data)),
  deleteGroupMessage: (messageId) =>
    client.delete(`/messages/groups/message/${messageId}`).then((r) => body(r.data)),
  topics: () => client.get("/messages/topics").then((r) => body(r.data)),
  topicMessages: (topicId, params) => client.get(`/messages/topics/${topicId}`, { params }).then((r) => body(r.data)),
};

// ─── AI ────────────────────────────────────────────────────────────────────
export const ai = {
  summarize: (payload) => {
    const data =
      typeof payload === "string"
        ? { content: payload }
        : {
            content: payload?.content ?? "",
            feedback_id: payload?.feedback_id ?? payload?.feedbackId,
          };
    return client.post("/ai/summarize-feedback", data).then((r) => body(r.data));
  },
};

// ─── System Config ─────────────────────────────────────────────────────────
export const systemConfig = {
  list: () => client.get("/system-config").then((r) => body(r.data)),
  update: (key, value, description) => client.put("/system-config", { key, value, description }).then((r) => body(r.data)),
};

// Legacy named exports (older components)
export const getSubmission = (id) => submissions.get(id);
export const getFeedbacks = (versionId) => feedbacks.byVersion(versionId);
export const createFeedback = (data) => feedbacks.create(data);
