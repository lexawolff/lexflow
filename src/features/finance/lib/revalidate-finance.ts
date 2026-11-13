import {
  revalidatePath,
} from "next/cache";

export function revalidatePayableViews() {
  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    "/financeiro",
  );

  revalidatePath(
    "/financeiro/contas-a-pagar",
  );

  revalidatePath(
    "/financeiro/fluxo-de-caixa",
  );
}

export function revalidateReceivableViews(
  clientId: string,
) {
  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    "/financeiro",
  );

  revalidatePath(
    "/financeiro/recebimentos",
  );

  revalidatePath(
    "/financeiro/fluxo-de-caixa",
  );

  revalidatePath(
    `/clientes/${clientId}`,
  );
}