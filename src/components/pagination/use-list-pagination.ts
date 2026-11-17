"use client";

import { useState } from "react";

import { paginate } from "./pagination-bar";

export const LIST_PAGE_SIZE = 20;

/*
 * Paginação de uma lista filtrada no navegador.
 *
 * resetKey representa os filtros atuais: quando ele muda, a lista volta
 * para a página 1 (sem useEffect).
 */
export function useListPagination<T>(
  items: T[],
  resetKey: string,
  pageSize: number = LIST_PAGE_SIZE,
) {
  const [state, setState] = useState({
    key: resetKey,
    page: 1,
  });

  const requestedPage = state.key === resetKey ? state.page : 1;
  const result = paginate(items, requestedPage, pageSize);

  return {
    ...result,
    total: items.length,
    setPage: (page: number) =>
      setState({
        key: resetKey,
        page,
      }),
  };
}
