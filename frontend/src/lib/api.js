import axios from "axios";

/* ================= BASE ================= */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api";

export const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  API_BASE_URL.replace(/\/?api\/?$/i, "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

/* ================= AXIOS ================= */

const jsonClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= TOKEN ================= */

jsonClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================= ERROR HANDLE ================= */

jsonClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "API ERROR:",
      error?.response?.data || error.message
    );

    if (error.response?.status === 401) {
      console.warn("Token hết hạn hoặc không hợp lệ");
    }

    return Promise.reject(error);
  }
);

/* ================= SAFE PARSER ================= */

function assertSuccess(body) {
  if (!body) return {};

  if (body.success === false) {
    console.error("API FAIL:", body.message);

    throw new Error(body.message || "API failed");
  }

  return body;
}

/* ================= SUBMISSION ================= */

export async function getSubmission(submissionId) {
  const { data } = await jsonClient.get(
    `/submissions/${submissionId}`
  );

  return assertSuccess(data).data;
}

export async function listSubmissions(params = {}) {
  const { data } = await jsonClient.get(
    "/submissions",
    { params }
  );

  return assertSuccess(data).data;
}

export async function uploadSubmission(formData) {
  const token = localStorage.getItem("token");

  const { data } = await axios.post(
    `${API_BASE_URL}/submissions/upload`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return assertSuccess(data).data;
}

/* ================= TEAM ================= */

export async function getTeams() {
  const { data } = await jsonClient.get("/teams");

  return assertSuccess(data).data;
}

/* ================= TEAM MANAGEMENT ================= */

export async function getTeamManagement(
  params = {},
  role = "student"
) {
  const endpoint =
    role === "supervisor"
      ? "/team-management/mentor"
      : "/team-management/management";

  const { data } = await jsonClient.get(
    endpoint,
    { params }
  );

  return assertSuccess(data).data;
}

/* ================= MILESTONE ================= */

export async function getMilestones() {
  const { data } = await jsonClient.get(
    "/milestones"
  );

  return assertSuccess(data).data;
}

/* ================= GROUP MANAGEMENT ================= */

export async function getGroups() {
  const { data } = await jsonClient.get(
    "/group-management"
  );

  return assertSuccess(data).data;
}

export async function createGroup(payload) {
  const { data } = await jsonClient.post(
    "/group-management",
    payload
  );

  return assertSuccess(data).data;
}

export async function deleteGroup(id) {
  const { data } = await jsonClient.delete(
    `/group-management/${id}`
  );

  return assertSuccess(data).data;
}

export async function updateGroup(id, payload) {
  const { data } = await jsonClient.put(
    `/group-management/${id}`,
    payload
  );

  return assertSuccess(data).data;
}

/* ================= STUDENTS ================= */

export async function getStudents() {
  const { data } = await jsonClient.get(
    "/group-management/students"
  );

  return assertSuccess(data).data;
}

/* ================= MENTORS ================= */

export async function getMentors() {
  const { data } = await jsonClient.get(
    "/group-management/mentors"
  );

  return assertSuccess(data).data;
}

/* ================= FEEDBACK ================= */

export async function createFeedback(payload) {
  const { data } = await jsonClient.post(
    "/feedbacks",
    payload
  );

  return assertSuccess(data).data;
}

export async function getFeedbacks(
  submissionVersionId
) {
  const { data } = await jsonClient.get(
    `/feedbacks/${submissionVersionId}`
  );

  return assertSuccess(data).data;
}