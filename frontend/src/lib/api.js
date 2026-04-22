import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  API_BASE_URL.replace(/\/?api\/?$/i, "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

const jsonClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

function assertSuccess(body) {
  if (body && body.success === false) {
    throw new Error(body.message || "API request failed");
  }
  return body;
}

export async function getSubmission(submissionId) {
  const { data } = await jsonClient.get(`/submissions/${submissionId}`);
  const body = assertSuccess(data);
  return body.data;
}

export async function listSubmissions(params = {}) {
  const { data } = await jsonClient.get("/submissions", { params });
  const body = assertSuccess(data);
  return body.data;
}

export async function uploadSubmission(formData) {
  const { data } = await axios.post(
    `${API_BASE_URL}/submissions/upload`,
    formData,
  );
  const body = assertSuccess(data);
  return body.data;
}

export async function getTeams() {
  const { data } = await jsonClient.get("/teams");
  const body = assertSuccess(data);
  return body.data;
}

export async function getMilestones() {
  const { data } = await jsonClient.get("/milestones");
  const body = assertSuccess(data);
  return body.data;
}

export async function createFeedback(payload) {
  const { data } = await jsonClient.post("/feedbacks", payload);
  const body = assertSuccess(data);
  return body.data;
}
export async function getFeedbacks(submissionVersionId) {
  const { data } = await jsonClient.get(
    `/feedbacks/${submissionVersionId}`
  );
  const body = assertSuccess(data);
  return body.data;
}

export async function lookupUserByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const { data } = await jsonClient.get("/auth/lookup", {
    params: { email: normalizedEmail },
  });
  const body = assertSuccess(data);
  return body.data;
}