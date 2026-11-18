import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

import {
  type NextRequest,
  NextResponse,
} from "next/server";

import {
  deleteExpiredUnconfirmedSignups,
} from "@/features/auth/lib/signup-cleanup";

export const dynamic = "force-dynamic";

function digest(
  value: string,
) {
  return createHash("sha256").update(value).digest();
}

// A Vercel envia CRON_SECRET neste cabeçalho. Sem o segredo, nada executa.
function isAuthorized(
  request: NextRequest,
) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");

  if (!secret || !header) {
    return false;
  }

  return timingSafeEqual(
    digest(header),
    digest(`Bearer ${secret}`),
  );
}

export async function GET(
  request: NextRequest,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 },
    );
  }

  try {
    const result = await deleteExpiredUnconfirmedSignups();

    return NextResponse.json(result);
  } catch {
    console.error("Falha ao limpar cadastros não confirmados.");

    return NextResponse.json(
      { error: "Falha na limpeza." },
      { status: 500 },
    );
  }
}
