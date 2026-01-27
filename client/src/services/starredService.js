const KEY = "starredIds";

export function getStarredSet() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return new Set(raw);
  } catch {
    return new Set();
  }
}

export function isStarred(id) {
  return getStarredSet().has(id);
}

export function toggleStar(id) {
  const set = getStarredSet();

  if (set.has(id)) set.delete(id);
  else set.add(id);

  localStorage.setItem(KEY, JSON.stringify([...set]));

  // כדי שכל המסכים יתעדכנו
  window.dispatchEvent(new Event("starred-changed"));

  return set.has(id); // מחזיר מצב אחרי toggle
}