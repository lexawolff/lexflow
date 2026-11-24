/*
 * E-mail que avisa o proprietário antes de apagar os dados de um escritório
 * cujo teste grátis terminou sem assinatura ou cuja assinatura terminou.
 */

export type TrialNoticeStage = "first" | "final";

type TrialDeletionNoticeInput = {
  stage: TrialNoticeStage;
  // Fim do teste ou fim da assinatura.
  kind?: "trial" | "subscription";
  officeName: string;
  endDate: string;
  deletionDate: string;
  appUrl: string;
  contactEmail: string;
};

// O nome do escritório é digitado por quem se cadastrou.
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildTrialDeletionNotice({
  stage,
  kind = "trial",
  officeName,
  endDate,
  deletionDate,
  appUrl,
  contactEmail,
}: TrialDeletionNoticeInput) {
  const subscribeUrl = `${appUrl}/assinar`;
  const isFinal = stage === "final";

  const subject = isFinal
    ? `Último aviso: os dados do seu escritório no LexFlow serão apagados em ${deletionDate}`
    : `Os dados do seu escritório no LexFlow serão apagados em ${deletionDate}`;

  const paragraphs = kind === "subscription"
    ? [
        `A assinatura do escritório ${officeName} no LexFlow terminou em ${endDate}. Desde então, ele está disponível só para consulta.`,
        `Como a assinatura não foi renovada, os dados do escritório, os arquivos enviados e as contas ligadas só a ele serão apagados definitivamente em ${deletionDate}.`,
        "Para manter tudo e voltar a cadastrar e editar, assine o LexFlow de novo antes dessa data.",
      ]
    : [
        `O teste grátis do escritório ${officeName} no LexFlow terminou em ${endDate}. Desde então, ele está disponível só para consulta.`,
        `Como nenhuma assinatura foi contratada, os dados do escritório, os arquivos enviados e as contas ligadas só a ele serão apagados definitivamente em ${deletionDate}.`,
        "Para manter tudo e voltar a cadastrar e editar, assine o LexFlow antes dessa data.",
      ];

  const footer = [
    `Quer uma cópia dos dados antes da exclusão? Responda este e-mail ou escreva para ${contactEmail}.`,
    isFinal
      ? "Este é o último aviso. Se não quiser continuar, não precisa fazer nada."
      : "Enviaremos mais um aviso perto da data. Se não quiser continuar, não precisa fazer nada.",
  ];

  const text = [
    "LexFlow",
    "",
    ...paragraphs,
    "",
    `Assinar o LexFlow: ${subscribeUrl}`,
    "",
    ...footer,
  ].join("\n");

  const safeOffice = escapeHtml(officeName);
  const htmlParagraphs = paragraphs
    .map((paragraph) => escapeHtml(paragraph).replace(safeOffice, `<strong>${safeOffice}</strong>`))
    .map((paragraph) => `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;">${paragraph}</p>`)
    .join("\n");

  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background-color:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <p style="margin:0;font-size:20px;font-weight:bold;color:#0f3d91;">LexFlow</p>
                <p style="margin:2px 0 0 0;font-size:13px;color:#6b7280;">Gestão Jurídica</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:#111827;">${isFinal ? "Último aviso antes da exclusão" : "Seus dados serão apagados"}</h1>
                ${htmlParagraphs}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 32px 24px 32px;">
                <a href="${escapeHtml(subscribeUrl)}" style="display:inline-block;background-color:#0f3d91;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 28px;border-radius:10px;">Assinar o LexFlow</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px 32px;border-top:1px solid #e5e7eb;">
                ${footer.map((line) => `<p style="margin:0 0 8px 0;font-size:12px;line-height:1.6;color:#6b7280;">${escapeHtml(line)}</p>`).join("\n                ")}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
