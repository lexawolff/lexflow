/*
 * Traduz os erros do Supabase Auth (em inglês) para mensagens ao
 * usuário. Usa o código do erro; nunca repassa a mensagem original.
 */
export function authErrorMessage(
  error: { code?: string; status?: number } | null | undefined,
  fallback: string,
): string {
  switch (error?.code) {
    case "weak_password":
      return "A senha é fraca demais. Use pelo menos 8 caracteres, misturando letras e números.";
    case "same_password":
      return "A nova senha deve ser diferente da atual.";
    case "email_exists":
    case "user_already_exists":
      return "Já existe uma conta com este e-mail. Peça ao escritório um convite para outro e-mail.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
    case "session_not_found":
    case "session_expired":
      return "Sua sessão expirou. Solicite um novo link de redefinição de senha.";
    default:
      break;
  }

  if (error?.status === 429) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  }

  return fallback;
}
