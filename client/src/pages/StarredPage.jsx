import FilesPage from "./FilesPage";
import { listStarred } from "../services/filesService";

export default function StarredPage() {
  return (
    <FilesPage
      title="Starred"
      fetchFn={listStarred}
    />
  );
}