import { useMemo } from "react";
import { useParams } from "react-router-dom";
import FilesPage from "./FilesPage";

export default function FolderPage() {
  const { id } = useParams(); // folderId

  const filterFn = useMemo(() => {
    return (item) => item.parentId === id;
  }, [id]);

  return (
    <FilesPage
      title={`Folder`}
      filterFn={filterFn}
      mode="grid"
    />
  );
}