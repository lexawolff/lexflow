/*
 * Regras do teste grátis. Sem dependências de servidor: usado também em
 * componentes do navegador.
 */
export const TRIAL_DAYS = 10;

// Prazo para assinar depois do fim do teste, antes de os dados serem apagados.
export const TRIAL_DATA_RETENTION_DAYS = 90;

// Avisos por e-mail, em dias antes da exclusão. A exclusão só ocorre depois
// de o último aviso ter sido enviado há pelo menos TRIAL_FINAL_NOTICE_DAYS.
export const TRIAL_FIRST_NOTICE_DAYS = 30;
export const TRIAL_FINAL_NOTICE_DAYS = 7;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const TRIAL_ENDED_MESSAGE =
  "Seu teste grátis terminou. O escritório está disponível só para consulta. Assine para voltar a cadastrar e editar.";

export function getTrialEndsAt(
  start: Date,
): Date {
  return new Date(start.getTime() + TRIAL_DAYS * DAY_IN_MS);
}

export function getTrialDataDeletionAt(
  trialEndsAt: Date,
): Date {
  return new Date(
    trialEndsAt.getTime() + TRIAL_DATA_RETENTION_DAYS * DAY_IN_MS,
  );
}

// Testes encerrados até este momento já podem ser apagados.
export function getTrialDataCutoff(
  now: Date,
): Date {
  return new Date(
    now.getTime() - TRIAL_DATA_RETENTION_DAYS * DAY_IN_MS,
  );
}

// Testes encerrados até estes momentos entram no primeiro e no último aviso.
export function getTrialNoticeWindows(
  now: Date,
) {
  const retention = TRIAL_DATA_RETENTION_DAYS * DAY_IN_MS;

  return {
    firstNoticeFrom: new Date(now.getTime() - retention + TRIAL_FIRST_NOTICE_DAYS * DAY_IN_MS),
    finalNoticeFrom: new Date(now.getTime() - retention + TRIAL_FINAL_NOTICE_DAYS * DAY_IN_MS),
  };
}

export function getTrialNoticeStage({
  trialEndsAt,
  noticeAt,
  finalNoticeAt,
  now,
}: {
  trialEndsAt: Date;
  noticeAt: Date | null;
  finalNoticeAt: Date | null;
  now: Date;
}): "first" | "final" | null {
  if (finalNoticeAt) {
    return null;
  }

  const deletionAt = getTrialDataDeletionAt(trialEndsAt).getTime();

  if (now.getTime() >= deletionAt - TRIAL_FINAL_NOTICE_DAYS * DAY_IN_MS) {
    return "final";
  }

  if (!noticeAt && now.getTime() >= deletionAt - TRIAL_FIRST_NOTICE_DAYS * DAY_IN_MS) {
    return "first";
  }

  return null;
}

// Último aviso enviado até este momento libera a exclusão.
export function getTrialFinalNoticeCutoff(
  now: Date,
): Date {
  return new Date(now.getTime() - TRIAL_FINAL_NOTICE_DAYS * DAY_IN_MS);
}

/*
 * Data em que os dados serão apagados: 90 dias após o fim do teste ou, se
 * o último aviso saiu atrasado, 7 dias depois dele.
 */
export function getPlannedTrialDeletionAt({
  trialEndsAt,
  finalNoticeAt,
}: {
  trialEndsAt: Date;
  finalNoticeAt: Date | null;
}): Date {
  const byRetention = getTrialDataDeletionAt(trialEndsAt).getTime();
  const byNotice = finalNoticeAt
    ? finalNoticeAt.getTime() + TRIAL_FINAL_NOTICE_DAYS * DAY_IN_MS
    : 0;

  return new Date(Math.max(byRetention, byNotice));
}

/*
 * Só o teste vencido limita o acesso. Escritórios sem assinatura registrada
 * são anteriores ao teste grátis e continuam com acesso completo.
 */
export function isWorkspaceReadOnly(
  subscription:
    | {
        status: string;
        trialEndsAt: Date | null;
      }
    | null
    | undefined,
  now: Date = new Date(),
): boolean {
  return (
    subscription?.status === "TRIALING" &&
    subscription.trialEndsAt !== null &&
    subscription.trialEndsAt.getTime() <= now.getTime()
  );
}
