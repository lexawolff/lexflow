import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type PaginationBarProps = {
  page: number;
  pageCount: number;
  total: number;
  shown: number;
  itemLabel: {
    singular: string;
    plural: string;
  };
  /*
   * Páginas renderizadas no servidor: links (a página fica na URL).
   * Listas filtradas no navegador: onPageChange.
   */
  hrefForPage?: (page: number) => string;
  onPageChange?: (page: number) => void;
  disabled?: boolean;
};

const buttonClass =
  "inline-flex size-9 items-center justify-center rounded-md border bg-background text-sm transition hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50 disabled:pointer-events-none disabled:opacity-50";

function PageButton({
  target,
  label,
  isDisabled,
  hrefForPage,
  onPageChange,
  children,
}: {
  target: number;
  label: string;
  isDisabled: boolean;
  hrefForPage?: (page: number) => string;
  onPageChange?: (page: number) => void;
  children: React.ReactNode;
}) {
  if (hrefForPage && !isDisabled) {
    return (
      <Link
        href={hrefForPage(target)}
        scroll={false}
        aria-label={label}
        className={buttonClass}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      disabled={isDisabled}
      onClick={() => onPageChange?.(target)}
      className={buttonClass}
    >
      {children}
    </button>
  );
}

export function PaginationBar({
  page,
  pageCount,
  total,
  shown,
  itemLabel,
  hrefForPage,
  onPageChange,
  disabled = false,
}: PaginationBarProps) {
  if (total === 0) {
    return null;
  }

  const noun = total === 1 ? itemLabel.singular : itemLabel.plural;

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-col gap-3 border-t bg-muted/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        Mostrando{" "}
        <span className="font-medium text-foreground">{shown}</span> de{" "}
        <span className="font-medium text-foreground">{total}</span> {noun}
      </p>

      {pageCount > 1 ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Página{" "}
            <span className="font-medium text-foreground">{page}</span> de{" "}
            <span className="font-medium text-foreground">{pageCount}</span>
          </span>

          <div className="flex gap-2">
            <PageButton
              target={page - 1}
              label="Página anterior"
              isDisabled={disabled || page <= 1}
              hrefForPage={hrefForPage}
              onPageChange={onPageChange}
            >
              <ChevronLeft className="size-4" />
            </PageButton>

            <PageButton
              target={page + 1}
              label="Próxima página"
              isDisabled={disabled || page >= pageCount}
              hrefForPage={hrefForPage}
              onPageChange={onPageChange}
            >
              <ChevronRight className="size-4" />
            </PageButton>
          </div>
        </div>
      ) : null}
    </nav>
  );
}

/*
 * Paginação de uma lista já carregada no navegador.
 * Corrige a página se a lista diminuir (ex.: novo filtro).
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const start = (currentPage - 1) * pageSize;

  return {
    pageItems: items.slice(start, start + pageSize),
    page: currentPage,
    pageCount,
  };
}
