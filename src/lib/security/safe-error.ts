import "server-only";

// Erros HTTP podem carregar Authorization, cookies, corpo da requisição e tokens.
// Só números HTTP válidos e códigos de uma lista fixa podem sair desta função.
export function safeErrorSummary(error: unknown): { status: number | null; code: string | null } {
  if (!error || typeof error !== "object") return { status: null, code: null };
  const candidate = error as { code?: unknown; response?: { status?: unknown } };
  const status = candidate.response?.status;
  const code = candidate.code;
  const allowedCodes = new Set(["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND"]);
  return {
    status: typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
    code: typeof code === "string" && allowedCodes.has(code) ? code : null,
  };
}
