"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Client = {
  id: string;

  name: string;

  cpf:
    string | null;

  phone:
    string | null;

  whatsapp:
    string | null;

  city:
    string | null;

  state:
    string | null;

  _count: {
    cases:
      number;
  };
};

function normalizeText(
  value:
    string,
): string {
  return value
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .trim();
}

function onlyNumbers(
  value:
    string,
): string {
  return value.replace(
    /\D/g,
    "",
  );
}

function formatCpf(
  value:
    string | null,
): string {
  if (!value) {
    return "-";
  }

  const numbers =
    onlyNumbers(
      value,
    );

  if (
    numbers.length !==
    11
  ) {
    return value;
  }

  return numbers.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    "$1.$2.$3-$4",
  );
}

function formatPhone(
  value:
    string | null,
): string {
  if (!value) {
    return "-";
  }

  const numbers =
    onlyNumbers(
      value,
    );

  if (
    numbers.length ===
    11
  ) {
    return numbers.replace(
      /(\d{2})(\d{5})(\d{4})/,
      "($1) $2-$3",
    );
  }

  if (
    numbers.length ===
    10
  ) {
    return numbers.replace(
      /(\d{2})(\d{4})(\d{4})/,
      "($1) $2-$3",
    );
  }

  return value;
}

function getInitials(
  name:
    string,
): string {
  const parts =
    name
      .trim()
      .split(
        /\s+/,
      )
      .filter(
        Boolean,
      );

  if (
    parts.length ===
    0
  ) {
    return "?";
  }

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .charAt(
        0,
      )
      .toUpperCase();
  }

  return (
    parts[0].charAt(
      0,
    ) +
    parts[
      parts.length -
      1
    ].charAt(
      0,
    )
  ).toUpperCase();
}

function locationLabel(
  client:
    Client,
): string {
  if (
    !client.city &&
    !client.state
  ) {
    return "-";
  }

  if (
    client.city &&
    client.state
  ) {
    return `${client.city} - ${client.state}`;
  }

  return (
    client.city ??
    client.state ??
    "-"
  );
}

const columns: ColumnDef<Client>[] =
  [
    {
      accessorKey:
        "name",

      header: ({
        column,
      }) => (
        <Button
          variant="ghost"
          className="-ml-3"
          onClick={() =>
            column.toggleSorting(
              column.getIsSorted() ===
                "asc",
            )
          }
        >
          Cliente

          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),

      cell: ({
        row,
      }) => {
        const client =
          row.original;

        return (
          <Link
            href={`/clientes/${client.id}`}
            className="group flex min-w-64 items-center gap-3"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
              {getInitials(
                client.name,
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate font-medium text-foreground transition group-hover:text-primary">
                {
                  client.name
                }
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                CPF{" "}
                {formatCpf(
                  client.cpf,
                )}
              </p>
            </div>
          </Link>
        );
      },
    },

    {
      id:
        "contact",

      header:
        "Contato",

      cell: ({
        row,
      }) => {
        const phone =
          row.original
            .whatsapp ??
          row.original
            .phone;

        return (
          <div className="min-w-36">
            <p className="text-sm">
              {formatPhone(
                phone,
              )}
            </p>

            {row.original
              .whatsapp ? (
              <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                WhatsApp
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Telefone
              </p>
            )}
          </div>
        );
      },
    },

    {
      accessorKey:
        "city",

      header: ({
        column,
      }) => (
        <Button
          variant="ghost"
          className="-ml-3"
          onClick={() =>
            column.toggleSorting(
              column.getIsSorted() ===
                "asc",
            )
          }
        >
          Localização

          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),

      cell: ({
        row,
      }) => (
        <div className="flex min-w-32 items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" />

          <span>
            {locationLabel(
              row.original,
            )}
          </span>
        </div>
      ),
    },

    {
      id:
        "cases",

      accessorFn: (
        client,
      ) =>
        client._count
          .cases,

      header: ({
        column,
      }) => (
        <Button
          variant="ghost"
          className="-ml-3"
          onClick={() =>
            column.toggleSorting(
              column.getIsSorted() ===
                "asc",
            )
          }
        >
          Casos

          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),

      cell: ({
        row,
      }) => {
        const count =
          row.original
            ._count
            .cases;

        return (
          <span className="inline-flex min-w-20 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
            {count}{" "}
            {count === 1
              ? "caso"
              : "casos"}
          </span>
        );
      },
    },

    {
      id:
        "actions",

      header:
        "",

      enableSorting:
        false,

      cell: ({
        row,
      }) => (
        <Link
          href={`/clientes/${row.original.id}`}
          aria-label={`Abrir ${row.original.name}`}
          className="ml-auto flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </Link>
      ),
    },
  ];

export function ClientsTable({
  clients,
}: {
  clients:
    Client[];
}) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    sorting,
    setSorting,
  ] =
    useState<SortingState>(
      [],
    );

  const filteredClients =
    useMemo(
      () => {
        const term =
          normalizeText(
            search,
          );

        const numericTerm =
          onlyNumbers(
            search,
          );

        if (
          !term
        ) {
          return clients;
        }

        return clients.filter(
          (
            client,
          ) => {
            const searchableText =
              normalizeText(
                [
                  client.name,
                  client.city,
                  client.state,
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  ),
              );

            const searchableNumbers =
              [
                client.cpf,
                client.phone,
                client.whatsapp,
              ]
                .filter(
                  Boolean,
                )
                .map(
                  (
                    value,
                  ) =>
                    onlyNumbers(
                      String(
                        value,
                      ),
                    ),
                )
                .join(
                  " ",
                );

            return (
              searchableText.includes(
                term,
              ) ||
              Boolean(
                numericTerm &&
                  searchableNumbers.includes(
                    numericTerm,
                  ),
              )
            );
          },
        );
      },
      [
        clients,
        search,
      ],
    );

  const table =
    useReactTable({
      data:
        filteredClients,

      columns,

      state: {
        sorting,
      },

      onSortingChange:
        setSorting,

      getCoreRowModel:
        getCoreRowModel(),

      getSortedRowModel:
        getSortedRowModel(),

      getPaginationRowModel:
        getPaginationRowModel(),

      initialState: {
        pagination: {
          pageSize:
            8,
        },
      },
    });

  const currentPage =
    table.getState()
      .pagination
      .pageIndex +
    1;

  const pageCount =
    Math.max(
      table.getPageCount(),
      1,
    );

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* ==========================
          CABEÇALHO DA LISTAGEM
      ========================== */}

      <div className="border-b bg-muted/20 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UsersRound className="size-5 text-primary" />

              <h2 className="font-semibold">
                Lista de clientes
              </h2>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Pesquise por
              nome, CPF,
              telefone ou
              cidade.
            </p>
          </div>

          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={
                search
              }
              onChange={(
                event,
              ) => {
                setSearch(
                  event
                    .target
                    .value,
                );

                table.setPageIndex(
                  0,
                );
              }}
              placeholder="Buscar cliente..."
              className="h-10 bg-background pl-9"
            />
          </div>
        </div>
      </div>

      {/* ==========================
          CONTAGEM
      ========================== */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3 sm:px-6">
        <p className="text-sm text-muted-foreground">
          {filteredClients.length ===
          1
            ? "1 cliente encontrado"
            : `${filteredClients.length} clientes encontrados`}
        </p>

        {search ? (
          <button
            type="button"
            onClick={() => {
              setSearch(
                "",
              );

              table.setPageIndex(
                0,
              );
            }}
            className="text-xs font-medium text-primary transition hover:underline"
          >
            Limpar busca
          </button>
        ) : null}
      </div>

      {/* ==========================
          TABELA
      ========================== */}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table
              .getHeaderGroups()
              .map(
                (
                  headerGroup,
                ) => (
                  <TableRow
                    key={
                      headerGroup.id
                    }
                    className="bg-muted/10 hover:bg-muted/10"
                  >
                    {headerGroup.headers.map(
                      (
                        header,
                      ) => (
                        <TableHead
                          key={
                            header.id
                          }
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header
                                  .column
                                  .columnDef
                                  .header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ),
                    )}
                  </TableRow>
                ),
              )}
          </TableHeader>

          <TableBody>
            {table
              .getRowModel()
              .rows
              .length ? (
              table
                .getRowModel()
                .rows
                .map(
                  (
                    row,
                  ) => (
                    <TableRow
                      key={
                        row.id
                      }
                      className="group transition hover:bg-muted/20"
                    >
                      {row
                        .getVisibleCells()
                        .map(
                          (
                            cell,
                          ) => (
                            <TableCell
                              key={
                                cell.id
                              }
                              className="py-4"
                            >
                              {flexRender(
                                cell
                                  .column
                                  .columnDef
                                  .cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ),
                        )}
                    </TableRow>
                  ),
                )
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length
                  }
                  className="h-60"
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                      <UserRound className="size-5 text-muted-foreground" />
                    </div>

                    <p className="mt-4 font-medium">
                      Nenhum
                      cliente
                      encontrado
                    </p>

                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Tente
                      pesquisar
                      por outro
                      nome, CPF,
                      telefone ou
                      cidade.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ==========================
          PAGINAÇÃO
      ========================== */}

      <div className="flex flex-col gap-4 border-t bg-muted/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted-foreground">
          Mostrando{" "}
          <span className="font-medium text-foreground">
            {
              table
                .getRowModel()
                .rows
                .length
            }
          </span>{" "}
          de{" "}
          <span className="font-medium text-foreground">
            {
              filteredClients.length
            }
          </span>{" "}
          clientes
        </p>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Página{" "}
            <span className="font-medium text-foreground">
              {
                currentPage
              }
            </span>{" "}
            de{" "}
            <span className="font-medium text-foreground">
              {
                pageCount
              }
            </span>
          </span>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="size-9 p-0"
              onClick={() =>
                table.previousPage()
              }
              disabled={
                !table.getCanPreviousPage()
              }
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="size-9 p-0"
              onClick={() =>
                table.nextPage()
              }
              disabled={
                !table.getCanNextPage()
              }
              aria-label="Próxima página"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}