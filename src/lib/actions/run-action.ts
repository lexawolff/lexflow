import "server-only";

import {
  unstable_rethrow,
} from "next/navigation";

import {
  ActionError,
} from "./action-error";

import type {
  ActionFailure,
  ActionResult,
} from "./action-result";

const GENERIC_ERROR_MESSAGE =
  "Não foi possível concluir a operação. Tente novamente.";

/*
 * Executa a lógica de uma Server Action
 * e devolve as falhas como valor.
 *
 * - redirect()/notFound() continuam
 *   funcionando (unstable_rethrow).
 * - ActionError: mensagem pensada para
 *   o usuário, devolvida como está.
 * - Qualquer outro erro (Prisma, rede…):
 *   registrado no servidor e trocado por
 *   uma mensagem genérica, sem vazar
 *   detalhes internos.
 */
export async function runAction<T>(
  handler: () => Promise<T>,
): Promise<T | ActionFailure> {
  try {
    return await handler();
  } catch (error) {
    unstable_rethrow(
      error,
    );

    if (
      error instanceof ActionError
    ) {
      return {
        actionError:
          error.message,
      };
    }

    console.error(
      "Erro inesperado em Server Action:",
      error,
    );

    return {
      actionError:
        GENERIC_ERROR_MESSAGE,
    };
  }
}

/*
 * Mesma proteção para actions que já
 * devolvem ActionResult ({ success,
 * message }): nenhum erro chega ao
 * navegador como exceção.
 */
export async function runActionResult<T>(
  handler: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const result =
    await runAction(
      handler,
    );

  if (
    typeof result === "object" &&
    result !== null &&
    "actionError" in result
  ) {
    return {
      success:
        false,

      message:
        result.actionError,
    };
  }

  return result;
}
