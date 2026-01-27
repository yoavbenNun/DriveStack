import { apiClient } from "./apiClient";

export async function listPermissions(fileId) {
  return apiClient.get(`/api/files/${fileId}/permissions`);
}

export async function addPermission(fileId, { type, holderId }) {
  return apiClient.post(`/api/files/${fileId}/permissions`, { type, holderId });
}

export async function updatePermission(fileId, permId, { type }) {
  return apiClient.patch(`/api/files/${fileId}/permissions/${permId}`, { type });
}

export async function deletePermission(fileId, permId) {
  return apiClient.del(`/api/files/${fileId}/permissions/${permId}`);
}