import "server-only";

/*
 * Cliente mínimo da API do Asaas (cobranças das assinaturas do LexFlow).
 * Endereço e chave vêm do ambiente: sandbox em testes, produção depois.
 */

export class AsaasError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly descriptions: string[],
  ) {
    super(message);
    this.name = "AsaasError";
  }
}

function getConfig() {
  const key = process.env.ASAAS_API_KEY;
  const url = process.env.ASAAS_API_URL;

  if (!key || !url) {
    throw new Error("Asaas não configurado (ASAAS_API_KEY e ASAAS_API_URL).");
  }

  return { key, url: url.replace(/\/+$/, "") };
}

async function request<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const { key, url } = getConfig();

  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      access_token: key,
      "User-Agent": "LexFlow/1.0",
      "Content-Type": "application/json",
    },
    // Requisições GET precisam ir sem corpo.
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const descriptions = Array.isArray(data?.errors)
      ? data.errors
          .map((item: { description?: unknown }) => item?.description)
          .filter((item: unknown): item is string => typeof item === "string")
      : [];

    throw new AsaasError(`Asaas respondeu ${response.status}.`, response.status, descriptions);
  }

  return data as T;
}

export async function createAsaasCustomer(input: {
  name: string;
  cpfCnpj: string;
  email: string;
  externalReference: string;
}): Promise<string> {
  const data = await request<{ id: string }>("POST", "/customers", input);

  return data.id;
}

export async function createAsaasSubscription(input: {
  customer: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD";
  value: number;
  cycle: "MONTHLY" | "YEARLY";
  nextDueDate: string;
  description: string;
  externalReference: string;
  callback?: { successUrl: string; autoRedirect: boolean };
}): Promise<{ id: string }> {
  return request<{ id: string }>("POST", "/subscriptions", input);
}

export async function getAsaasSubscription(
  subscriptionId: string,
): Promise<{ id: string; status: string; cycle: string; deleted?: boolean }> {
  return request("GET", `/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export type AsaasPayment = {
  id: string;
  status: string;
  billingType: string;
  dueDate: string;
  value?: number;
  invoiceUrl?: string | null;
};

export async function listAsaasSubscriptionPayments(
  subscriptionId: string,
): Promise<AsaasPayment[]> {
  const data = await request<{ data?: AsaasPayment[] }>(
    "GET",
    `/subscriptions/${encodeURIComponent(subscriptionId)}/payments`,
  );

  return data.data ?? [];
}

export async function deleteAsaasSubscription(
  subscriptionId: string,
): Promise<void> {
  await request("DELETE", `/subscriptions/${encodeURIComponent(subscriptionId)}`);
}
