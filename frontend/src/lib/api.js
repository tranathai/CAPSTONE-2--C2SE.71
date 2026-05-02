import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  API_BASE_URL.replace(/\/?api\/?$/i, "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

// ✅ axios instance
const jsonClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ✅ AUTO GẮN TOKEN
jsonClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ HANDLE 401
jsonClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized - Token invalid hoặc hết hạn");

      // 👉 nếu muốn auto logout thì mở cái này
      // localStorage.removeItem("token");
      // window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

function assertSuccess(body) {
  if (body && body.success === false) {
    throw new Error(body.message || "API request failed");
  }
  return body;
}

/* ================= SUBMISSION ================= */

export async function getSubmission(submissionId) {
  const { data } = await jsonClient.get(`/submissions/${submissionId}`);
  return assertSuccess(data).data;
}

export async function listSubmissions(params = {}) {
  const { data } = await jsonClient.get("/submissions", { params });
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

/* ================= TEAMS ================= */

export async function getTeams() {
  const { data } = await jsonClient.get("/teams");
  return assertSuccess(data).data;
}

/* ================= TEAM MANAGEMENT (FIX CHUẨN) ================= */

export async function getTeamManagement(params = {}, role = "student") {
  const endpoint =
    role === "supervisor"
      ? "/team-management/mentor"
      : "/team-management/management";

  const { data } = await jsonClient.get(endpoint, {
    params,
  });

  return assertSuccess(data).data;
}

/* ================= MILESTONE ================= */

export async function getMilestones() {
  const { data } = await jsonClient.get("/milestones");
  return assertSuccess(data).data;
}

/* ================= FEEDBACK ================= */

export async function createFeedback(payload) {
  const { data } = await jsonClient.post("/feedbacks", payload);
  return assertSuccess(data).data;
}

export async function getFeedbacks(submissionVersionId) {
  const { data } = await jsonClient.get(
    `/feedbacks/${submissionVersionId}`
  );
  return assertSuccess(data).data;
}