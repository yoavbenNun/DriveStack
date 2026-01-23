const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"; // update to the port of Node-Server

export function getToken() {
  return localStorage.getItem("token"); 
}

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      (data && data.message) ||
      (typeof data === "string" ? data : "Request failed");
    throw new Error(msg);
  }

  return data;
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  del: (path) => request(path, { method: "DELETE" }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
};
