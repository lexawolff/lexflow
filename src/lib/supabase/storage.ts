import "server-only";

import {
  createAdminClient,
} from "./admin";

export function getStorage() {
  const supabase =
    createAdminClient();

  return supabase.storage;
}