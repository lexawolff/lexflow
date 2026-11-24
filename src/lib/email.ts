import "server-only";

import {
  Resend,
} from "resend";

// Remetente verificado no Resend (subdomínio mail.lexflowjuridico.com.br).
export const EMAIL_FROM =
  "LexFlow <nao-responda@mail.lexflowjuridico.com.br>";

type SendEmailInput = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  // Evita duplicar o envio quando a mesma operação é repetida.
  idempotencyKey?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  idempotencyKey,
}: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada.");
  }

  const { error } = await new Resend(apiKey).emails.send(
    {
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text,
      replyTo,
    },
    { idempotencyKey },
  );

  if (error) {
    throw new Error(`Falha no envio de e-mail: ${error.name ?? "erro"}`);
  }
}

// Endereço público do sistema, usado nos links dos e-mails enviados fora
// de uma requisição (rotinas agendadas).
export function getAppUrl(): string {
  return (process.env.APP_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
}
