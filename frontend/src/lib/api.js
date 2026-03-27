const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || "API request failed";
    throw new Error(message);
  }

  return data;
}

export async function getSubmission(submissionId) {
  return request(`/submissions/${submissionId}`);
}

export async function getFeedbacks(versionId) {
  return request(`/feedbacks/${versionId}`);
}

export async function createFeedback(payload) {
  return request("/feedbacks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
