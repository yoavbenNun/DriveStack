import { apiClient } from "./apiClient";

export async function isStarred(id) {
  const file = await apiClient.get(`/api/files/${id}`);
  return Boolean(file.starred);
}

export async function toggleStar(id, currentValue) {
  const next = !Boolean(currentValue);
  const updated = await apiClient.patch(`/api/files/${id}/star`, { starred: next });
  window.dispatchEvent(new Event("starred-changed"));
  return Boolean(updated.starred);
}
