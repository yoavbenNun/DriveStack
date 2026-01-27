// client/src/services/apiClient.js

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

function buildUrl(path) {
  // אם כבר URL מלא (http/https) - תחזיר כמו שהוא
  if (/^https?:\/\//i.test(path)) return path;

  // אחרת תדביק ל-API_BASE
  return `${API_BASE}${path}`;
}

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("token");

  let userId = null;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    userId = user?.id || null;
  } catch {}

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userId ? { "x-user-id": userId } : {}), // ✅ ADD THIS
    ...extra,
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    let msg = "Request failed";
    try {
      const data = await res.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  // 204 No Content
  if (res.status === 204) return true;

  const text = await res.text();
  if (!text) return true;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const apiClient = {
  async get(path) {
    const res = await fetch(buildUrl(path), {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async post(path, body) {
    const res = await fetch(buildUrl(path), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async patch(path, body) {
    const res = await fetch(buildUrl(path), {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },

  async del(path) {
    const res = await fetch(buildUrl(path), {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};