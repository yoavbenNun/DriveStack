import { useEffect } from "react";
import { onFileUpdated } from "../utils/filesEvents";

export default function useLiveFileUpdates(setItems, options = {}) {
  const { removeWhen = () => false } = options;

  useEffect(() => {
    const unsub = onFileUpdated((payload) => {
      if (!payload?.id) return;

      setItems((prev) => {
        if (!Array.isArray(prev)) return prev;

        if (removeWhen(payload)) {
          return prev.filter((x) => x.id !== payload.id);
        }

        return prev.map((x) => (x.id === payload.id ? { ...x, ...payload } : x));
      });
    });

    return unsub;
  }, [setItems, removeWhen]);
}