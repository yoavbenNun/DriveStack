import FilesPage from "./FilesPage";
import { listSharedWithMe } from "../services/filesQueries";

export default function SharedWithMe() {
  return <FilesPage title="Shared With Me" fetchFn={listSharedWithMe} />;
}