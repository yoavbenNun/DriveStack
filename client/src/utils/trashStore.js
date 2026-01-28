import { apiClient } from "../services/apiClient";

export async function getTrash() {
  // return only things in the trash 
  const data = await apiClient.get("/api/files?trashed=true");
  return Array.isArray(data) ? data : (data.files ?? data.items ?? []);
}

export async function addToTrash(item) {
  if (!item?.id) return;
  await apiClient.patch(`/api/files/${item.id}/trash`, { trashed: true });

  window.dispatchEvent(new Event("trash-changed"));
}

export async function removeFromTrash(id) {
  if (!id) return;
  await apiClient.patch(`/api/files/${id}/trash`, { trashed: false });

  window.dispatchEvent(new Event("trash-changed"));
}

export async function clearTrash() {
  //endpoint if we want to claen all the trash
  const trash = await getTrash();
  await Promise.all(trash.map(x =>
    apiClient.delete(`/api/files/${x.id}`) // final clean
  ));

  window.dispatchEvent(new Event("trash-changed"));
}
