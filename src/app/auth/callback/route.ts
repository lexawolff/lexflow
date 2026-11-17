import type {
  EmailOtpType,
} from "@supabase/supabase-js";

import {
  type NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "recovery",
  "invite",
  "magiclink",
  "signup",
  "email",
  "email_change",
]);

/*
 * Só caminhos internos: impede usar ?next= para redirecionar
 * a outro site (open redirect).
 */
function safeNextPath(
  value: string | null,
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return "/dashboard";
  }

  return value;
}

/*
 * Destino dos links enviados por e-mail pelo Supabase Auth
 * (ex.: redefinição de senha). Aceita os dois formatos:
 * - ?code=...                 (padrão, fluxo PKCE)
 * - ?token_hash=...&type=...  (modelos de e-mail personalizados)
 */
export async function GET(
  request: NextRequest,
) {
  const searchParams = request.nextUrl.searchParams;
  const next = safeNextPath(searchParams.get("next"));

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  let ok = false;

  if (code) {
    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    ok = !error;
  } else if (
    tokenHash &&
    type &&
    EMAIL_OTP_TYPES.has(type)
  ) {
    const { error } =
      await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

    ok = !error;
  }

  const destination = request.nextUrl.clone();
  destination.search = "";

  if (ok) {
    destination.pathname = next;
  } else {
    destination.pathname = "/login";
    destination.searchParams.set("erro", "link-invalido");
  }

  return NextResponse.redirect(destination);
}
