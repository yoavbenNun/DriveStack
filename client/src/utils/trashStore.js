const KEY = "drive_trash_v1";

export function getTrash() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function addToTrash(item) {
  if (!item?.id) return;

  const trash = getTrash();

  // לא להכניס פעמיים אותו קובץ
  const exists = trash.some((x) => x.id === item.id);
  if (exists) return;

  const next = [
    {
      ...item,
      trashedAt: new Date().toISOString(),
    },
    ...trash,
  ];

  localStorage.setItem(KEY, JSON.stringify(next));
}

export function removeFromTrash(id) {
  const trash = getTrash().filter((x) => x.id !== id);
  localStorage.setItem(KEY, JSON.stringify(trash));
}

export function clearTrash() {
  localStorage.setItem(KEY, JSON.stringify([]));
}