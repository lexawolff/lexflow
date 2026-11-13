import "server-only";

export const GOOGLE_REAUTH_MESSAGE =
  "Sua conexão com o Google Agenda expirou. Reconecte sua conta Google.";

function safeStringify(
  value: unknown,
): string {
  try {
    return JSON.stringify(
      value,
    );
  } catch {
    return "";
  }
}

export function isGoogleReauthRequired(
  error: unknown,
): boolean {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  const candidate =
    error as {
      message?: string;

      response?: {
        data?: {
          error?: string;
          error_description?: string;
        };
      };
    };

  const googleError =
    candidate.response
      ?.data
      ?.error;

  const description =
    candidate.response
      ?.data
      ?.error_description;

  const message =
    candidate.message ?? "";

  const serialized =
    safeStringify(
      candidate.response?.data,
    );

  return (
    googleError ===
      "invalid_grant" ||
    message.includes(
      "invalid_grant",
    ) ||
    description?.includes(
      "expired",
    ) === true ||
    description?.includes(
      "revoked",
    ) === true ||
    serialized.includes(
      "invalid_grant",
    )
  );
}
