/*
 * Regras do teste grátis. Sem dependências de servidor: usado também em
 * componentes do navegador.
 */
export const TRIAL_DAYS = 10;

// Prazo para assinar depois do fim do teste, antes de os dados serem apagados.
export const TRIAL_DATA_RETENTION_DAYS = 90;

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
