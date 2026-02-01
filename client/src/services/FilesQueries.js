import { listFiles } from "./filesService";
import { getCurrentUserId } from "../utils/auth";
import { isSharedWithMe } from "../utils/permissions";

export async function listSharedWithMe() {
  const userId = getCurrentUserId();
  const all = await listFiles();

  // filter shared with me
  return all.filter((it) => isSharedWithMe(it, userId));
}