export function getCurrentUserId() {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      return u?.id || null;
    } catch {
      return null;
    }
  }