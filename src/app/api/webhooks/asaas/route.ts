import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

import {
  type NextRequest,
  NextResponse,
} from "next/server";

import {
  syncAsaasSubscription,
} from "@/features/settings/services/sync-asaas-subscription";

import {
  prisma,
} from "@/lib/prisma";

export const dynamic = "force-dynamic";

function digest(
  value: string,
) {
  return createHash("sha256").update(value).digest();
}

// Token configurado no webhook do Asaas. Nunca a chave da API.
function isAuthorized(
  request: NextRequest,
) {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  const received = request.headers.get("asaas-access-token");

  if (!token || !received) {
    return false;
  }

  return timingSafeEqual(digest(received), digest(token));
}

/*
 * Avisos do Asaas sobre cobranças e assinaturas. O conteúdo do aviso só
 * diz qual assinatura mudou: o estado vem de uma consulta ao próprio Asaas.
 *
 * Depois de autenticado, sempre responde 200: o Asaas interrompe a fila de
 * avisos após falhas seguidas, e a conferência diária cobre o que falhar.
 */
export async function POST(
  request: NextRequest,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);

  const providerSubscriptionId =
    payload?.payment?.subscription ?? payload?.subscription?.id ?? null;

  if (typeof providerSubscriptionId !== "string" || !providerSubscriptionId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const subscription = await prisma.subscription.findFirst({
    where: { providerSubscriptionId },
    select: { id: true },
  });

  // Assinatura substituída ou de outro sistema: nada a fazer.
  if (!subscription) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    await syncAsaasSubscription(subscription.id);
  } catch {
    console.error("Falha ao sincronizar assinatura após aviso do Asaas:", subscription.id);
  }

  return NextResponse.json({ received: true });
}
