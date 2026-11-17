import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireWorkspacePermission } from "@/lib/permissions";

export const CLIENTS_PAGE_SIZE = 20;

export const CLIENT_SORTS = [
  "nome",
  "-nome",
  "cidade",
  "-cidade",
  "processos",
  "-processos",
] as const;

export type ClientSort = (typeof CLIENT_SORTS)[number];

export type GetClientsInput = {
  q?: string;
  page?: number;
  sort?: string;
};

// Mesma normalização da busca que existia no navegador.
function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

export function parseClientSort(value: string | undefined): ClientSort {
  return CLIENT_SORTS.includes(value as ClientSort)
    ? (value as ClientSort)
    : "nome";
}

function getOrderBy(sort: ClientSort): Prisma.ClientOrderByWithRelationInput[] {
  const direction = sort.startsWith("-") ? "desc" : "asc";

  switch (sort.replace("-", "")) {
    case "cidade":
      return [
        { city: { sort: direction, nulls: "last" } },
        { name: "asc" },
        { id: "asc" },
      ];
    case "processos":
      return [
        { cases: { _count: direction } },
        { name: "asc" },
        { id: "asc" },
      ];
    default:
      return [{ name: direction }, { id: "asc" }];
  }
}

/*
 * Acentos removidos ANTES do lower(): assim a busca não depende da
 * configuração de idioma do banco para converter "É", "Ã" etc.
 */
const ACCENTED =
  "áàâãäåéèêëíìîïóòôõöúùûüçñýÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝ";
const PLAIN =
  "aaaaaaeeeeiiiiooooouuuucnyaaaaaaeeeeiiiiooooouuuucny";

/*
 * Busca no banco com as mesmas regras da busca antiga: nome, cidade e UF
 * sem acentos; CPF, telefone e WhatsApp só pelos números.
 * strpos evita tratar % e _ digitados como curingas.
 */
async function findMatchingClientIds(
  workspaceId: string,
  term: string,
  digits: string,
): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Client"
    WHERE "workspaceId" = ${workspaceId}
      AND (
        strpos(
          lower(
            translate(
              concat_ws(' ', "name", "city", "state"),
              ${ACCENTED},
              ${PLAIN}
            )
          ),
          ${term}
        ) > 0
        OR (
          ${digits} <> ''
          AND strpos(
            concat_ws(
              ' ',
              regexp_replace("cpf", '[^0-9]', '', 'g'),
              regexp_replace("phone", '[^0-9]', '', 'g'),
              regexp_replace("whatsapp", '[^0-9]', '', 'g')
            ),
            ${digits}
          ) > 0
        )
      )
  `;

  return rows.map((row) => row.id);
}

export async function getClients({
  q = "",
  page = 1,
  sort,
}: GetClientsInput = {}) {
  const { workspace } = await requireWorkspacePermission("CLIENT_VIEW");

  const term = normalizeText(q).slice(0, 100);
  const digits = onlyNumbers(q).slice(0, 20);
  const currentSort = parseClientSort(sort);

  const where: Prisma.ClientWhereInput = {
    workspaceId: workspace.id,
    ...(term
      ? { id: { in: await findMatchingClientIds(workspace.id, term, digits) } }
      : {}),
  };

  const total = await prisma.client.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / CLIENTS_PAGE_SIZE));
  const currentPage = Math.min(
    Math.max(1, Number.isFinite(page) ? Math.trunc(page) : 1),
    pageCount,
  );

  // Somente os campos usados por ClientsTable atravessam a fronteira do cliente.
  // Um tipo TypeScript mais estreito no componente não remove campos em runtime.
  const clients = await prisma.client.findMany({
    where,
    select: {
      id: true,
      name: true,
      cpf: true,
      phone: true,
      whatsapp: true,
      city: true,
      state: true,
      _count: { select: { cases: true } },
    },
    orderBy: getOrderBy(currentSort),
    skip: (currentPage - 1) * CLIENTS_PAGE_SIZE,
    take: CLIENTS_PAGE_SIZE,
  });

  return {
    clients,
    total,
    page: currentPage,
    pageCount,
    pageSize: CLIENTS_PAGE_SIZE,
    q: q.trim(),
    sort: currentSort,
  };
}
