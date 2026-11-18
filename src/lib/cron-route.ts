import "server-only";

import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

import {
  type NextRequest,
  NextResponse,
} from "next/server";

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

export async function runCronJob(
  request: NextRequest,
  description: string,
  job: () => Promise<unknown>,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 },
    );
  }

  try {
    return NextResponse.json(await job());
  } catch {
    console.error(`Falha na rotina: ${description}.`);

    return NextResponse.json(
      { error: "Falha na rotina." },
      { status: 500 },
    );
  }
}
