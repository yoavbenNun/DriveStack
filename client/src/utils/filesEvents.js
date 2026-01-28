// client/src/utils/filesEvents.js

export const FILE_UPDATED = "file-updated";

export function emitFileUpdated(payload) {
  window.dispatchEvent(new CustomEvent(FILE_UPDATED, { detail: payload }));
}

export function onFileUpdated(handler) {
  const wrapped = (e) => handler(e.detail);
  window.addEventListener(FILE_UPDATED, wrapped);
  return () => window.removeEventListener(FILE_UPDATED, wrapped);
}