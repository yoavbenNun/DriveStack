export function hasPermission(item, userId) {
    if (!item || !userId) return false;
    const perms = Array.isArray(item.permissions) ? item.permissions : [];
  
    return perms.some((p) => p?.userId === userId);
  }
  
  export function isSharedWithMe(item, userId) {
    if (!item || !userId) return false;
    if (item.deletedAt) return false;
    if (item.ownerId === userId) return false;
  
    return hasPermission(item, userId);
  }