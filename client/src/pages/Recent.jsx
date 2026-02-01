import { useCallback } from "react";
import FilesPage from "./FilesPage";

export default function Recent() {
  const filterFn = useCallback(() => true, []);

  return (
    <FilesPage
      title="Recent"
      filterFn={filterFn}
    />
  );
}