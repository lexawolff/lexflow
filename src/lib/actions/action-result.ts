export type ActionResult<T = void> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

/*
 * Em produção o Next.js substitui a
 * mensagem de qualquer erro lançado
 * por uma Server Action por um texto
 * genérico em inglês.
 *
 * Por isso as actions devolvem a falha
 * como valor (ver runAction) em vez de
 * lançar o erro até o navegador.
 */
export type ActionFailure = {
  actionError: string;
};

export function isActionFailure(
  value: unknown,
): value is ActionFailure {
  return (
    typeof value === "object" &&
    value !== null &&
    "actionError" in value &&
    typeof (value as ActionFailure)
      .actionError === "string"
  );
}

/*
 * Usado no navegador: transforma a
 * falha devolvida pela action em um
 * Error comum, com a mensagem original,
 * para os blocos try/catch existentes.
 */
export function unwrapAction<T>(
  result: T | ActionFailure,
): T {
  if (isActionFailure(result)) {
    throw new Error(
      result.actionError,
    );
  }

  return result;
}

/*
 * Versão de uma action que lança
 * Error (com a mensagem original)
 * quando falha. Uso no navegador:
 *
 *   await throwOnFailure(minhaAction)(formData);
 */
export function throwOnFailure<
  TArgs extends unknown[],
  TResult,
>(
  action: (
    ...args: TArgs
  ) => Promise<TResult | ActionFailure>,
) {
  return async (
    ...args: TArgs
  ): Promise<TResult> =>
    unwrapAction(
      await action(
        ...args,
      ),
    );
}
