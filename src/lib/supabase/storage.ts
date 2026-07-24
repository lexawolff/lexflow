import { supabaseAdmin } from "./admin";

export function getStorage() {
  return supabaseAdmin.storage;
}