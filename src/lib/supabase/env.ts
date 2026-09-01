export function getSupabaseUrl(): string {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL não configurada.",
    );
  }

  return value;
}

export function getSupabasePublishableKey(): string {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error(
      "Chave pública do Supabase não configurada.",
    );
  }

  return value;
}

export function getSupabaseSecretKey(): string {
  const value =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!value) {
    throw new Error(
      "SUPABASE_SECRET_KEY não configurada.",
    );
  }

  return value;
}