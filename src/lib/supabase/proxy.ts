import {
  createServerClient,
} from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "./env";

function isPublicRoute(
  pathname: string,
): boolean {
  return (
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname === "/termos" ||
    pathname === "/privacidade" ||
    pathname === "/recuperar-senha" ||
    pathname.startsWith(
      "/convite/",
    ) ||
    pathname.startsWith(
      "/auth/",
    ) ||
    // Protegida pelo CRON_SECRET na própria rota.
    pathname.startsWith(
      "/api/cron/",
    )
  );
}

export async function updateSession(
  request: NextRequest,
) {
  let response =
    NextResponse.next({
      request,
    });

  const supabase =
    createServerClient(
      getSupabaseUrl(),
      getSupabasePublishableKey(),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(
            cookiesToSet,
          ) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value,
                );
              },
            );

            response =
              NextResponse.next({
                request,
              });

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                response.cookies.set(
                  name,
                  value,
                  options,
                );
              },
            );
          },
        },
      },
    );

  /*
   * O Supabase recomenda validar
   * a identidade com getClaims()
   * em código de proteção de rotas,
   * em vez de confiar apenas no
   * conteúdo local de getSession().
   */
  const {
    data,
    error,
  } =
    await supabase.auth.getClaims();

  const authenticated =
    !error &&
    Boolean(
      data?.claims?.sub,
    );

  const pathname =
    request.nextUrl.pathname;

  if (
    !authenticated &&
    !isPublicRoute(
      pathname,
    )
  ) {
    const url =
      request.nextUrl.clone();

    url.pathname =
      "/login";

    /*
     * Guardamos o destino para
     * podermos evoluir futuramente
     * para voltar à página original.
     */
    if (
      pathname !== "/"
    ) {
      url.searchParams.set(
        "next",
        `${pathname}${request.nextUrl.search}`,
      );
    }

    return NextResponse.redirect(
      url,
    );
  }

  return response;
}