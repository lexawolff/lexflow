import "server-only";

import {
  headers,
} from "next/headers";

/*
 * Endereço do LexFlow usado nos links enviados por e-mail pelo Supabase.
 * O Supabase só aceita o destino se ele estiver em Authentication >
 * URL Configuration > Redirect URLs (caso contrário usa o Site URL).
 */
export async function getAppOrigin(): Promise<string> {
  const headerList = await headers();

  const origin = headerList.get("origin");

  if (origin) {
    return origin;
  }

  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "localhost:3000";

  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}
