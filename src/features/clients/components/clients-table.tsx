"use client";

import Link from "next/link";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";

type Client = {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  whatsapp?: string | null;
  city: string | null;
  state?: string | null;
  _count: {
    cases: number;
  };
};

const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Nome
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/clientes/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "cpf",
    header: "CPF",
    cell: ({ row }) => row.original.cpf || "-",
  },
  {
    accessorKey: "phone",
    header: "Telefone",
    cell: ({ row }) => row.original.whatsapp || row.original.phone || "-",
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Cidade
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const city = row.original.city;
      const state = row.original.state;

      if (!city && !state) return "-";

      return `${city || ""}${city && state ? " - " : ""}${state || ""}`;
    },
  },
  {
    accessorKey: "_count.cases",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Casos
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => row.original._count.cases,
  },
];

export function ClientsTable({ clients }: { clients: Client[] }) {

  const [search, setSearch] = useState("");

  const [sorting, setSorting] = useState<SortingState>([]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return clients.filter((client) => {
      return (
        client.name
          .trim()
          .toLowerCase()
          .includes(term) ||
        (client.cpf ?? "").includes(term) ||
        (client.phone ?? "").includes(term) ||
        (client.whatsapp ?? "").includes(term) ||
        (client.city ?? "")
          .trim()
          .toLowerCase()
          .includes(term));
    });
  }, [clients, search]);

  const table = useReactTable({
    data: filteredClients,
    columns,

    state: {
      sorting,
    },

    onSortingChange: setSorting,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  return (
    <div className="space-y-4 p-4">
      <Input
        placeholder="Pesquisar por nome, CPF, telefone ou cidade..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md bg-white"
      />
      <p className="text-sm text-muted-foreground">
        {filteredClients.length} cliente(s) encontrado(s)
      </p>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">

        <p className="text-sm text-muted-foreground">
          Mostrando{" "}
          <strong>{table.getRowModel().rows.length}</strong> de{" "}
          <strong>{filteredClients.length}</strong> cliente(s)
        </p>

        <div className="flex items-center gap-6">

          <span className="text-sm text-muted-foreground">
            Página{" "}
            <strong>{table.getState().pagination.pageIndex + 1}</strong>{" "}
            de{" "}
            <strong>{table.getPageCount()}</strong>
          </span>

          <div className="flex gap-2">

            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Próxima
            </Button>

          </div>

        </div>

      </div>

    </div>
  );
}