"use client";

import {
  useMemo,
  useState,
} from "react";

import type { FinancialStatus } from "@prisma/client";

import { ClientDetails } from "@/features/clients/types";

import {
  getDateTimestamp,
  getEffectiveFinancialStatus,
} from "../lib/receivable-display";

import type { ReceivableCaseOption } from "./create-receivable-form";
import { InstallmentGroupCard } from "./installment-group-card";
import { ReceivableCard } from "./receivable-card";

type Props = {
  client: ClientDetails;
};

type FilterValue =
  | "TODOS"
  | "PENDENTE"
  | "ATRASADO"
  | "PAGO"
  | "CANCELADO";

type BucketStatus =
  | "PENDENTE"
  | "ATRASADO"
  | "PAGO"
  | "CANCELADO";

type ReceivableItem =
  ClientDetails["receivables"][number];

type SingleDisplayUnit = {
  kind: "single";

  key: string;

  status: BucketStatus;

  sortTimestamp: number | null;

  receivable: ReceivableItem;
};

type GroupDisplayUnit = {
  kind: "group";

  key: string;

  status: BucketStatus;

  sortTimestamp: number | null;

  receivables: ReceivableItem[];
};

type DisplayUnit =
  | SingleDisplayUnit
  | GroupDisplayUnit;

const filters: {
  value: FilterValue;
  label: string;
}[] = [
  {
    value: "TODOS",
    label: "Todos",
  },

  {
    value: "PENDENTE",
    label: "A receber",
  },

  {
    value: "ATRASADO",
    label: "Atrasados",
  },

  {
    value: "PAGO",
    label: "Pagos",
  },

  {
    value: "CANCELADO",
    label: "Cancelados",
  },
];

function getCaseOptions(
  client: ClientDetails,
): ReceivableCaseOption[] {
  return client.cases.map(
    (clientCase) => {
      const caseNumber =
        clientCase.number ??
        clientCase.administrativeNumber;

      return {
        id: clientCase.id,

        label: caseNumber
          ? `${clientCase.title} • ${caseNumber}`
          : clientCase.title,
      };
    },
  );
}

function getDisplayStatus(
  receivable: ReceivableItem,
): FinancialStatus {
  return getEffectiveFinancialStatus(
    receivable.status,
    receivable.dueDate,
  );
}

function getBucketStatus(
  status: FinancialStatus,
): BucketStatus {
  if (
    status === "ATRASADO"
  ) {
    return "ATRASADO";
  }

  if (
    status === "PAGO"
  ) {
    return "PAGO";
  }

  if (
    status === "CANCELADO"
  ) {
    return "CANCELADO";
  }

  /*
   * PENDENTE e PARCIAL são
   * cobranças ainda em aberto.
   */
  return "PENDENTE";
}

function getGroupBucketStatus(
  receivables: ReceivableItem[],
): BucketStatus {
  const statuses =
    receivables.map(
      (receivable) =>
        getDisplayStatus(
          receivable,
        ),
    );

  if (
    statuses.some(
      (status) =>
        status === "ATRASADO",
    )
  ) {
    return "ATRASADO";
  }

  if (
    statuses.some(
      (status) =>
        status === "PENDENTE" ||
        status === "PARCIAL",
    )
  ) {
    return "PENDENTE";
  }

  if (
    statuses.every(
      (status) =>
        status === "CANCELADO",
    )
  ) {
    return "CANCELADO";
  }

  /*
   * Se não há nenhuma em aberto
   * nem atrasada, o grupo está
   * financeiramente encerrado.
   *
   * Pode haver parcelas pagas e
   * canceladas no mesmo grupo.
   */
  return "PAGO";
}

function matchesFilter(
  receivable: ReceivableItem,
  filter: FilterValue,
): boolean {
  if (
    filter === "TODOS"
  ) {
    return true;
  }

  const status =
    getDisplayStatus(
      receivable,
    );

  if (
    filter === "PENDENTE"
  ) {
    return (
      status === "PENDENTE" ||
      status === "PARCIAL"
    );
  }

  return status === filter;
}

function compareByDueDate(
  first: ReceivableItem,
  second: ReceivableItem,
): number {
  const firstDate =
    getDateTimestamp(
      first.dueDate,
    );

  const secondDate =
    getDateTimestamp(
      second.dueDate,
    );

  if (
    firstDate === null &&
    secondDate === null
  ) {
    return 0;
  }

  if (
    firstDate === null
  ) {
    return 1;
  }

  if (
    secondDate === null
  ) {
    return -1;
  }

  return (
    firstDate -
    secondDate
  );
}

function comparePaid(
  first: ReceivableItem,
  second: ReceivableItem,
): number {
  const firstDate =
    getDateTimestamp(
      first.receivedAt,
    ) ??
    getDateTimestamp(
      first.dueDate,
    ) ??
    0;

  const secondDate =
    getDateTimestamp(
      second.receivedAt,
    ) ??
    getDateTimestamp(
      second.dueDate,
    ) ??
    0;

  return (
    secondDate -
    firstDate
  );
}

function sortReceivables(
  receivables: ReceivableItem[],
  status: BucketStatus,
): ReceivableItem[] {
  const copy = [
    ...receivables,
  ];

  if (
    status === "PAGO"
  ) {
    return copy.sort(
      comparePaid,
    );
  }

  if (
    status === "CANCELADO"
  ) {
    return copy.sort(
      (first, second) => {
        const firstDate =
          getDateTimestamp(
            first.createdAt,
          ) ?? 0;

        const secondDate =
          getDateTimestamp(
            second.createdAt,
          ) ?? 0;

        return (
          secondDate -
          firstDate
        );
      },
    );
  }

  return copy.sort(
    compareByDueDate,
  );
}

function getSingleSortTimestamp(
  receivable: ReceivableItem,
  status: BucketStatus,
): number | null {
  if (
    status === "PAGO"
  ) {
    return (
      getDateTimestamp(
        receivable.receivedAt,
      ) ??
      getDateTimestamp(
        receivable.dueDate,
      )
    );
  }

  if (
    status === "CANCELADO"
  ) {
    return getDateTimestamp(
      receivable.createdAt,
    );
  }

  return getDateTimestamp(
    receivable.dueDate,
  );
}

function getGroupSortTimestamp(
  receivables: ReceivableItem[],
  status: BucketStatus,
): number | null {
  if (
    status === "PAGO"
  ) {
    const timestamps =
      receivables
        .map(
          (receivable) =>
            getDateTimestamp(
              receivable.receivedAt,
            ) ??
            getDateTimestamp(
              receivable.dueDate,
            ),
        )
        .filter(
          (
            value,
          ): value is number =>
            value !== null,
        );

    if (
      timestamps.length === 0
    ) {
      return null;
    }

    return Math.max(
      ...timestamps,
    );
  }

  if (
    status === "CANCELADO"
  ) {
    const timestamps =
      receivables
        .map(
          (receivable) =>
            getDateTimestamp(
              receivable.createdAt,
            ),
        )
        .filter(
          (
            value,
          ): value is number =>
            value !== null,
        );

    if (
      timestamps.length === 0
    ) {
      return null;
    }

    return Math.max(
      ...timestamps,
    );
  }

  const relevantDueDates =
    receivables
      .filter(
        (receivable) => {
          const currentStatus =
            getDisplayStatus(
              receivable,
            );

          return (
            currentStatus !==
              "PAGO" &&
            currentStatus !==
              "CANCELADO"
          );
        },
      )
      .map(
        (receivable) =>
          getDateTimestamp(
            receivable.dueDate,
          ),
      )
      .filter(
        (
          value,
        ): value is number =>
          value !== null,
      );

  if (
    relevantDueDates.length ===
    0
  ) {
    return null;
  }

  return Math.min(
    ...relevantDueDates,
  );
}

function buildDisplayUnits(
  receivables: ReceivableItem[],
): DisplayUnit[] {
  const singles:
    ReceivableItem[] = [];

  const groups =
    new Map<
      string,
      ReceivableItem[]
    >();

  for (
    const receivable of
    receivables
  ) {
    if (
      !receivable.installmentGroupId
    ) {
      singles.push(
        receivable,
      );

      continue;
    }

    const existing =
      groups.get(
        receivable.installmentGroupId,
      );

    if (existing) {
      existing.push(
        receivable,
      );
    } else {
      groups.set(
        receivable.installmentGroupId,
        [receivable],
      );
    }
  }

  const units: DisplayUnit[] =
    singles.map(
      (receivable) => {
        const status =
          getBucketStatus(
            getDisplayStatus(
              receivable,
            ),
          );

        return {
          kind: "single",
          key: receivable.id,
          status,
          sortTimestamp:
            getSingleSortTimestamp(
              receivable,
              status,
            ),
          receivable,
        };
      },
    );

  for (
    const [
      groupId,
      groupReceivables,
    ] of groups
  ) {
    const status =
      getGroupBucketStatus(
        groupReceivables,
      );

    units.push({
      kind: "group",
      key: groupId,
      status,
      sortTimestamp:
        getGroupSortTimestamp(
          groupReceivables,
          status,
        ),
      receivables:
        groupReceivables,
    });
  }

  return units;
}

function sortDisplayUnits(
  units: DisplayUnit[],
  status: BucketStatus,
): DisplayUnit[] {
  return [...units].sort(
    (first, second) => {
      const firstDate =
        first.sortTimestamp;

      const secondDate =
        second.sortTimestamp;

      if (
        firstDate === null &&
        secondDate === null
      ) {
        return 0;
      }

      if (
        firstDate === null
      ) {
        return 1;
      }

      if (
        secondDate === null
      ) {
        return -1;
      }

      if (
        status === "PAGO" ||
        status ===
          "CANCELADO"
      ) {
        return (
          secondDate -
          firstDate
        );
      }

      return (
        firstDate -
        secondDate
      );
    },
  );
}

export function ReceivablesList({
  client,
}: Props) {
  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<FilterValue>(
      "TODOS",
    );

  const caseOptions =
    useMemo(
      () =>
        getCaseOptions(client),
      [client],
    );

  const counts =
    useMemo(() => {
      const result: Record<
        FilterValue,
        number
      > = {
        TODOS: 0,
        PENDENTE: 0,
        ATRASADO: 0,
        PAGO: 0,
        CANCELADO: 0,
      };

      for (
        const receivable of
        client.receivables
      ) {
        const status =
          getDisplayStatus(
            receivable,
          );

        result.TODOS += 1;

        if (
          status ===
            "PENDENTE" ||
          status ===
            "PARCIAL"
        ) {
          result.PENDENTE += 1;

          continue;
        }

        if (
          status ===
          "ATRASADO"
        ) {
          result.ATRASADO += 1;

          continue;
        }

        if (
          status === "PAGO"
        ) {
          result.PAGO += 1;

          continue;
        }

        if (
          status ===
          "CANCELADO"
        ) {
          result.CANCELADO += 1;
        }
      }

      return result;
    }, [client.receivables]);

  const filteredReceivables =
    useMemo(
      () =>
        client.receivables.filter(
          (receivable) =>
            matchesFilter(
              receivable,
              activeFilter,
            ),
        ),
      [
        client.receivables,
        activeFilter,
      ],
    );

  if (
    client.receivables.length ===
    0
  ) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="font-medium">
          Nenhum recebimento
          cadastrado.
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          Os recebimentos deste
          cliente aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {filters.map(
          (filter) => {
            const isActive =
              activeFilter ===
              filter.value;

            return (
              <button
                key={
                  filter.value
                }
                type="button"
                onClick={() =>
                  setActiveFilter(
                    filter.value,
                  )
                }
                className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {filter.label}

                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                    isActive
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {
                    counts[
                      filter.value
                    ]
                  }
                </span>
              </button>
            );
          },
        )}
      </div>

      {activeFilter ===
      "TODOS" ? (
        <AllReceivablesView
          receivables={
            client.receivables
          }
          caseOptions={
            caseOptions
          }
        />
      ) : filteredReceivables.length >
        0 ? (
        <FilteredReceivablesView
          receivables={
            filteredReceivables
          }
          filter={
            activeFilter
          }
          caseOptions={
            caseOptions
          }
        />
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum recebimento nesta
          situação.
        </div>
      )}
    </section>
  );
}

function AllReceivablesView({
  receivables,
  caseOptions,
}: {
  receivables:
    ReceivableItem[];

  caseOptions:
    ReceivableCaseOption[];
}) {
  const units =
    buildDisplayUnits(
      receivables,
    );

  const overdue =
    sortDisplayUnits(
      units.filter(
        (unit) =>
          unit.status ===
          "ATRASADO",
      ),
      "ATRASADO",
    );

  const pending =
    sortDisplayUnits(
      units.filter(
        (unit) =>
          unit.status ===
          "PENDENTE",
      ),
      "PENDENTE",
    );

  const paid =
    sortDisplayUnits(
      units.filter(
        (unit) =>
          unit.status ===
          "PAGO",
      ),
      "PAGO",
    );

  const canceled =
    sortDisplayUnits(
      units.filter(
        (unit) =>
          unit.status ===
          "CANCELADO",
      ),
      "CANCELADO",
    );

  return (
    <div className="space-y-8">
      <ReceivableGroup
        title="Em atraso"
        description="Cobranças e parcelamentos que exigem atenção."
        units={overdue}
        caseOptions={
          caseOptions
        }
      />

      <ReceivableGroup
        title="A receber"
        description="Próximos recebimentos e valores em aberto."
        units={pending}
        caseOptions={
          caseOptions
        }
      />

      <ReceivableGroup
        title="Recebidos"
        description="Cobranças e parcelamentos já encerrados financeiramente."
        units={paid}
        caseOptions={
          caseOptions
        }
      />

      <ReceivableGroup
        title="Cancelados"
        description="Cobranças preservadas somente para histórico."
        units={canceled}
        caseOptions={
          caseOptions
        }
      />
    </div>
  );
}

function FilteredReceivablesView({
  receivables,
  filter,
  caseOptions,
}: {
  receivables:
    ReceivableItem[];

  filter: Exclude<
    FilterValue,
    "TODOS"
  >;

  caseOptions:
    ReceivableCaseOption[];
}) {
  let sorted =
    receivables;

  if (
    filter === "PAGO"
  ) {
    sorted =
      sortReceivables(
        receivables,
        "PAGO",
      );
  } else if (
    filter ===
    "CANCELADO"
  ) {
    sorted =
      sortReceivables(
        receivables,
        "CANCELADO",
      );
  } else if (
    filter ===
    "ATRASADO"
  ) {
    sorted =
      sortReceivables(
        receivables,
        "ATRASADO",
      );
  } else {
    sorted =
      sortReceivables(
        receivables,
        "PENDENTE",
      );
  }

  return (
    <div className="space-y-4">
      {sorted.map(
        (receivable) => (
          <ReceivableCard
            key={receivable.id}
            receivable={
              receivable
            }
            caseOptions={
              caseOptions
            }
          />
        ),
      )}
    </div>
  );
}

function ReceivableGroup({
  title,
  description,
  units,
  caseOptions,
}: {
  title: string;

  description: string;

  units: DisplayUnit[];

  caseOptions:
    ReceivableCaseOption[];
}) {
  if (
    units.length === 0
  ) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">
            {title}
          </h3>

          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {units.length}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="space-y-3">
        {units.map(
          (unit) => {
            if (
              unit.kind ===
              "group"
            ) {
              return (
                <InstallmentGroupCard
                  key={
                    unit.key
                  }
                  receivables={
                    unit.receivables
                  }
                  caseOptions={
                    caseOptions
                  }
                />
              );
            }

            return (
              <ReceivableCard
                key={unit.key}
                receivable={
                  unit.receivable
                }
                caseOptions={
                  caseOptions
                }
              />
            );
          },
        )}
      </div>
    </section>
  );
}