const STAR_KEY = "drive_starred_ids_v1";
const TRASH_KEY = "drive_trash_items_v1";

// ---------- Starred ----------
export function getStarredIds() {
  try {
    return JSON.parse(localStorage.getItem(STAR_KEY) || "[]");
  } catch {
    return [];
  }
}

export function isStarred(id) {
  return getStarredIds().includes(id);
}

export function toggleStar(id) {
  const set = new Set(getStarredIds());
  if (set.has(id)) set.delete(id);
  else set.add(id);
  const arr = [...set];
  localStorage.setItem(STAR_KEY, JSON.stringify(arr));
  return arr;
}

// Trash
export function getTrashItems() {
  try {
    return JSON.parse(localStorage.getItem(TRASH_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToTrash(item) {
  const prev = getTrashItems();
  const next = [
    {
      ...item,
      trashedAt: new Date().toISOString(),
    },
    ...prev.filter((x) => x.id !== item.id),
  ];
  localStorage.setItem(TRASH_KEY, JSON.stringify(next));
  return next;
}

export function removeFromTrash(id) {
  const prev = getTrashItems();
  const next = prev.filter((x) => x.id !== id);
  localStorage.setItem(TRASH_KEY, JSON.stringify(next));
  return next;
}

export function clearTrash() {
  localStorage.setItem(TRASH_KEY, JSON.stringify([]));
}