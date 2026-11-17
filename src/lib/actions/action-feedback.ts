import {
  toast,
} from "sonner";

import {
  isActionFailure,
} from "./action-result";

/*
 * Mostra a mensagem da falha em um
 * aviso. Retorna true quando houve falha.
 */
export function notifyActionFailure(
  result: unknown,
): boolean {
  if (
    !isActionFailure(
      result,
    )
  ) {
    return false;
  }

  toast.error(
    result.actionError,
  );

  return true;
}

/*
 * Para <form action={...}>: executa a
 * Server Action e, se ela falhar,
 * avisa o usuário em vez de ignorar
 * o erro ou derrubar a página.
 */
export function withFailureToast<
  TArgs extends unknown[],
>(
  action: (
    ...args: TArgs
  ) => Promise<unknown>,
) {
  return async (
    ...args: TArgs
  ): Promise<void> => {
    notifyActionFailure(
      await action(
        ...args,
      ),
    );
  };
}
