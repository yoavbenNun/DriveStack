const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"; // update to the port of Node-Server

export function getToken() {
  return localStorage.getItem("token"); 
}

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err?.error || err?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204 || res.status === 205) return null;

  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const apiClient = {
  get: (url) => request("GET", url),
  post: (url, body) => request("POST", url, body),
  patch: (url, body) => request("PATCH", url, body),
  delete: (url) => request("DELETE", url),
};

