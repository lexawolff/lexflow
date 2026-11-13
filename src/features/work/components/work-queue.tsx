"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    DragDropProvider,
    useDroppable,
} from "@dnd-kit/react";

import {
    useSortable,
} from "@dnd-kit/react/sortable";

import {
    move,
} from "@dnd-kit/helpers";

import {
    GripVertical,
    Pencil,
    Trash2,
    X,
} from "lucide-react";

import {
    WorkItemStatus,
    WorkPlanningPeriod,
} from "@prisma/client";

import {
    completeWorkItemAction,
    deleteWorkItemAction,
    moveWorkItemToTopAction,
    saveWorkQueueOrderAction,
    startWorkItemAction,
    updateWorkItemAction,
} from "@/features/work/actions/work-items";

export type WorkQueueItem = {
    id: string;
    title: string;
    description: string | null;
    status: WorkItemStatus;
    period: WorkPlanningPeriod;
    dueDate: string | null;

    client: {
        id: string;
        name: string;
    } | null;

    case: {
        id: string;
        title: string;
    } | null;
};

export type WorkClientOption = {
    id: string;
    name: string;
};

export type WorkCaseOption = {
    id: string;
    clientId: string;
    title: string;
    number: string | null;
};

type WorkQueueProps = {
    items: WorkQueueItem[];
    clients: WorkClientOption[];
    cases: WorkCaseOption[];
    canEdit: boolean;
    canDelete: boolean;
};

type WorkQueueGroups = Record<
    WorkPlanningPeriod,
    WorkQueueItem[]
>;

const TIME_ZONE =
    "America/Sao_Paulo";

const DAY_IN_MS =
    24 * 60 * 60 * 1000;

type DeadlineTone =
    | "overdue"
    | "today"
    | "soon"
    | "normal"
    | "none";

type DeadlineInfo = {
    label: string;
    tone: DeadlineTone;
};

function createGroups(
    items: WorkQueueItem[],
): WorkQueueGroups {
    return {
        [WorkPlanningPeriod.ESTA_SEMANA]:
            items.filter(
                (item) =>
                    item.period ===
                    WorkPlanningPeriod.ESTA_SEMANA,
            ),

        [WorkPlanningPeriod.ESTE_MES]:
            items.filter(
                (item) =>
                    item.period ===
                    WorkPlanningPeriod.ESTE_MES,
            ),

        [WorkPlanningPeriod.DEPOIS]:
            items.filter(
                (item) =>
                    item.period ===
                    WorkPlanningPeriod.DEPOIS,
            ),
    };
}

function cloneGroups(
    groups: WorkQueueGroups,
): WorkQueueGroups {
    return {
        [WorkPlanningPeriod.ESTA_SEMANA]:
            [
                ...groups[
                WorkPlanningPeriod.ESTA_SEMANA
                ],
            ],

        [WorkPlanningPeriod.ESTE_MES]:
            [
                ...groups[
                WorkPlanningPeriod.ESTE_MES
                ],
            ],

        [WorkPlanningPeriod.DEPOIS]:
            [
                ...groups[
                WorkPlanningPeriod.DEPOIS
                ],
            ],
    };
}

function hasSameOrder(
    first: WorkQueueGroups,
    second: WorkQueueGroups,
) {
    const periods: WorkPlanningPeriod[] =
        [
            WorkPlanningPeriod.ESTA_SEMANA,
            WorkPlanningPeriod.ESTE_MES,
            WorkPlanningPeriod.DEPOIS,
        ];

    return periods.every(
        (period) => {
            const firstIds =
                first[
                    period
                ].map(
                    (item) =>
                        item.id,
                );

            const secondIds =
                second[
                    period
                ].map(
                    (item) =>
                        item.id,
                );

            return (
                firstIds.length ===
                secondIds.length &&
                firstIds.every(
                    (
                        id,
                        index,
                    ) =>
                        id ===
                        secondIds[
                        index
                        ],
                )
            );
        },
    );
}

function formatDate(
    value: string,
) {
    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            timeZone:
                TIME_ZONE,
        },
    ).format(
        new Date(value),
    );
}

function toDateInputValue(
    value: string | null,
) {
    if (!value) {
        return "";
    }

    return value.slice(
        0,
        10,
    );
}

function getCalendarDayValue(
    date: Date,
) {
    const parts =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone:
                    TIME_ZONE,

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",
            },
        ).formatToParts(
            date,
        );

    const year =
        Number(
            parts.find(
                (part) =>
                    part.type ===
                    "year",
            )?.value,
        );

    const month =
        Number(
            parts.find(
                (part) =>
                    part.type ===
                    "month",
            )?.value,
        );

    const day =
        Number(
            parts.find(
                (part) =>
                    part.type ===
                    "day",
            )?.value,
        );

    if (
        !Number.isFinite(
            year,
        ) ||
        !Number.isFinite(
            month,
        ) ||
        !Number.isFinite(
            day,
        )
    ) {
        throw new Error(
            "Não foi possível interpretar a data.",
        );
    }

    return Date.UTC(
        year,
        month - 1,
        day,
    );
}

function getDeadlineInfo(
    value: string | null,
): DeadlineInfo {
    if (!value) {
        return {
            label:
                "Sem prazo formal",

            tone:
                "none",
        };
    }

    const dueDate =
        new Date(
            value,
        );

    const today =
        new Date();

    const difference =
        Math.round(
            (
                getCalendarDayValue(
                    dueDate,
                ) -
                getCalendarDayValue(
                    today,
                )
            ) /
            DAY_IN_MS,
        );

    const formattedDate =
        formatDate(
            value,
        );

    if (
        difference < 0
    ) {
        const days =
            Math.abs(
                difference,
            );

        return {
            label:
                `Atrasado há ${days} ${days === 1
                    ? "dia"
                    : "dias"
                } · ${formattedDate}`,

            tone:
                "overdue",
        };
    }

    if (
        difference === 0
    ) {
        return {
            label:
                `Vence hoje · ${formattedDate}`,

            tone:
                "today",
        };
    }

    if (
        difference === 1
    ) {
        return {
            label:
                `Vence amanhã · ${formattedDate}`,

            tone:
                "soon",
        };
    }

    return {
        label:
            `Vence em ${difference} dias · ${formattedDate}`,

        tone:
            difference <= 7
                ? "soon"
                : "normal",
    };
}

function getDeadlineClassName(
    tone: DeadlineTone,
) {
    switch (tone) {
        case "overdue":
        case "today":
            return "rounded-full bg-destructive/10 px-2 py-1 font-medium text-destructive";

        case "soon":
            return "rounded-full bg-amber-500/15 px-2 py-1 font-medium text-amber-700 dark:text-amber-300";

        case "normal":
            return "rounded-full bg-muted px-2 py-1 font-medium";

        case "none":
            return "rounded-full bg-muted px-2 py-1 text-muted-foreground";
    }
}

function SortableWorkItem({
    item,
    index,
    group,
    clients,
    cases,
    canEdit,
    canDelete,
    saving,
}: {
    item: WorkQueueItem;
    index: number;
    group: WorkPlanningPeriod;
    clients: WorkClientOption[];
    cases: WorkCaseOption[];
    canEdit: boolean;
    canDelete: boolean;
    saving: boolean;
}) {
    const [
        editing,
        setEditing,
    ] =
        useState(false);

    const [
        editClientId,
        setEditClientId,
    ] =
        useState(
            item.client?.id ??
            "",
        );

    const [
        editCaseId,
        setEditCaseId,
    ] =
        useState(
            item.case?.id ??
            "",
        );

    const filteredEditCases =
        useMemo(
            () =>
                editClientId
                    ? cases.filter(
                        (caseItem) =>
                            caseItem.clientId ===
                            editClientId,
                    )
                    : [],
            [
                cases,
                editClientId,
            ],
        );

    const {
        ref,
        handleRef,
        isDragging,
    } =
        useSortable({
            id:
                item.id,

            index,

            group,

            type:
                "item",

            accept:
                "item",

            disabled:
                !canEdit ||
                saving ||
                editing,
        });

    const deadline =
        getDeadlineInfo(
            item.dueDate,
        );

    return (
        <div
            ref={ref}
            className={`rounded-xl border bg-card p-4 transition-all ${isDragging
                    ? "scale-[1.01] opacity-70 shadow-lg"
                    : "hover:shadow-sm"
                }`}
        >
            <div className="flex gap-3">
                {canEdit && (
                    <button
                        ref={
                            handleRef
                        }
                        type="button"
                        disabled={
                            saving ||
                            editing
                        }
                        aria-label={`Mover ${item.title}`}
                        title="Arraste para alterar a prioridade"
                        className="mt-0.5 flex h-8 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <GripVertical className="h-5 w-5" />
                    </button>
                )}

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <p className="font-semibold">
                                {item.client
                                    ?.name ??
                                    item.title}
                            </p>

                            {item.client && (
                                <p className="mt-0.5 text-sm">
                                    {
                                        item.title
                                    }
                                </p>
                            )}

                            {item.case && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {
                                        item.case
                                            .title
                                    }
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {canEdit &&
                                !editing && (
                                    <button
                                        type="button"
                                        disabled={
                                            saving
                                        }
                                        onClick={() => {
                                            setEditClientId(
                                                item.client?.id ??
                                                "",
                                            );

                                            setEditCaseId(
                                                item.case?.id ??
                                                "",
                                            );

                                            setEditing(
                                                true,
                                            );
                                        }}
                                        className="flex cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />

                                        Editar
                                    </button>
                                )}

                            {canEdit &&
                                index > 0 &&
                                !editing && (
                                    <form
                                        action={
                                            moveWorkItemToTopAction
                                        }
                                    >
                                        <input
                                            type="hidden"
                                            name="id"
                                            value={
                                                item.id
                                            }
                                        />

                                        <button
                                            type="submit"
                                            disabled={
                                                saving
                                            }
                                            className="cursor-pointer rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Mover para o topo
                                        </button>
                                    </form>
                                )}

                            {canEdit &&
                                item.status ===
                                WorkItemStatus.PENDENTE &&
                                !editing && (
                                    <form
                                        action={
                                            startWorkItemAction
                                        }
                                    >
                                        <input
                                            type="hidden"
                                            name="id"
                                            value={
                                                item.id
                                            }
                                        />

                                        <button
                                            type="submit"
                                            disabled={
                                                saving
                                            }
                                            className="cursor-pointer rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Iniciar
                                        </button>
                                    </form>
                                )}

                            {canEdit &&
                                !editing && (
                                    <form
                                        action={
                                            completeWorkItemAction
                                        }
                                    >
                                        <input
                                            type="hidden"
                                            name="id"
                                            value={
                                                item.id
                                            }
                                        />

                                        <button
                                            type="submit"
                                            disabled={
                                                saving
                                            }
                                            className="cursor-pointer rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Concluir
                                        </button>
                                    </form>
                                )}

                            {canDelete &&
                                !editing && (
                                    <form
                                        action={
                                            deleteWorkItemAction
                                        }
                                        onSubmit={
                                            (
                                                event,
                                            ) => {
                                                const confirmed =
                                                    window.confirm(
                                                        `Remover "${item.title}" da fila de trabalho?`,
                                                    );

                                                if (
                                                    !confirmed
                                                ) {
                                                    event.preventDefault();
                                                }
                                            }
                                        }
                                    >
                                        <input
                                            type="hidden"
                                            name="id"
                                            value={
                                                item.id
                                            }
                                        />

                                        <button
                                            type="submit"
                                            disabled={
                                                saving
                                            }
                                            title="Remover da fila"
                                            className="flex cursor-pointer items-center gap-1 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />

                                            Remover
                                        </button>
                                    </form>
                                )}
                        </div>
                    </div>

                    {item.description &&
                        !editing && (
                            <p className="mt-3 text-sm text-muted-foreground">
                                {
                                    item.description
                                }
                            </p>
                        )}

                    {!editing && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            {item.status ===
                                WorkItemStatus.EM_ANDAMENTO && (
                                    <span className="rounded-full bg-muted px-2 py-1 font-medium">
                                        Em andamento
                                    </span>
                                )}

                            <span
                                className={getDeadlineClassName(
                                    deadline.tone,
                                )}
                            >
                                {
                                    deadline.label
                                }
                            </span>
                        </div>
                    )}

                    {editing && (
                        <form
                            action={
                                updateWorkItemAction
                            }
                            onSubmit={() =>
                                setEditing(
                                    false,
                                )
                            }
                            className="mt-4 grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-2"
                        >
                            <input
                                type="hidden"
                                name="id"
                                value={
                                    item.id
                                }
                            />

                            <div className="md:col-span-2">
                                <label
                                    htmlFor={`title-${item.id}`}
                                    className="mb-1 block text-sm font-medium"
                                >
                                    O que precisa ser feito?
                                </label>

                                <input
                                    id={`title-${item.id}`}
                                    name="title"
                                    required
                                    defaultValue={
                                        item.title
                                    }
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor={`client-${item.id}`}
                                    className="mb-1 block text-sm font-medium"
                                >
                                    Cliente
                                </label>
                                <select
  id={`client-${item.id}`}
  name="clientId"
  value={
    editClientId
  }
  onChange={(
    event,
  ) => {
    setEditClientId(
      event.target.value,
    );

    setEditCaseId(
      "",
    );
  }}
  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
>
  <option value="">
    Sem cliente
  </option>

  {clients.map(
    (client) => (
      <option
        key={
          client.id
        }
        value={
          client.id
        }
      >
        {
          client.name
        }
      </option>
    ),
  )}
</select>
                            </div>

                            <div>
                                <label
                                    htmlFor={`case-${item.id}`}
                                    className="mb-1 block text-sm font-medium"
                                >
                                    Caso
                                </label>

                                <select
  id={`case-${item.id}`}
  name="caseId"
  value={
    editCaseId
  }
  onChange={(
    event,
  ) =>
    setEditCaseId(
      event.target.value,
    )
  }
  disabled={
    !editClientId ||
    filteredEditCases.length ===
      0
  }
  className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
>
  {!editClientId ? (
    <option value="">
      Selecione um cliente primeiro
    </option>
  ) : filteredEditCases.length ===
    0 ? (
    <option value="">
      Este cliente não possui casos
    </option>
  ) : (
    <>
      <option value="">
        Sem caso específico
      </option>

      {filteredEditCases.map(
        (
          caseItem,
        ) => (
          <option
            key={
              caseItem.id
            }
            value={
              caseItem.id
            }
          >
            {
              caseItem.title
            }

            {caseItem.number
              ? ` · ${caseItem.number}`
              : ""}
          </option>
        ),
      )}
    </>
  )}
</select>

{editClientId &&
filteredEditCases.length >
  0 ? (
  <p className="mt-1 text-xs text-muted-foreground">
    Mostrando apenas os casos deste cliente.
  </p>
) : null}
                            </div>

                            <div>
                                <label
                                    htmlFor={`period-${item.id}`}
                                    className="mb-1 block text-sm font-medium"
                                >
                                    Planejamento
                                </label>

                                <select
                                    id={`period-${item.id}`}
                                    name="period"
                                    defaultValue={
                                        item.period
                                    }
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="ESTA_SEMANA">
                                        Esta semana
                                    </option>

                                    <option value="ESTE_MES">
                                        Este mês
                                    </option>

                                    <option value="DEPOIS">
                                        Depois
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor={`dueDate-${item.id}`}
                                    className="mb-1 block text-sm font-medium"
                                >
                                    Prazo real
                                </label>

                                <input
                                    id={`dueDate-${item.id}`}
                                    name="dueDate"
                                    type="date"
                                    defaultValue={toDateInputValue(
                                        item.dueDate,
                                    )}
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label
                                    htmlFor={`description-${item.id}`}
                                    className="mb-1 block text-sm font-medium"
                                >
                                    Observação
                                </label>

                                <textarea
                                    id={`description-${item.id}`}
                                    name="description"
                                    rows={3}
                                    defaultValue={
                                        item.description ??
                                        ""
                                    }
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-2 md:col-span-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setEditing(
                                            false,
                                        )
                                    }
                                    className="flex cursor-pointer items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    <X className="h-4 w-4" />

                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
                                >
                                    Salvar alterações
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

function WorkSection({
    title,
    period,
    items,
    clients,
    cases,
    canEdit,
    canDelete,
    saving,
}: {
    title: string;
    period: WorkPlanningPeriod;
    items: WorkQueueItem[];
    clients: WorkClientOption[];
    cases: WorkCaseOption[];
    canEdit: boolean;
    canDelete: boolean;
    saving: boolean;
}) {
    const {
        ref,
        isDropTarget,
    } =
        useDroppable({
            id:
                period,

            type:
                "column",

            accept:
                "item",

            disabled:
                !canEdit ||
                saving,
        });

    return (
        <section className="space-y-3">
            <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">
                    {title}
                </h2>

                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {
                        items.length
                    }
                </span>
            </div>

            <div
                ref={ref}
                className={`min-h-24 space-y-3 rounded-xl transition-colors ${isDropTarget
                        ? "bg-primary/5 ring-2 ring-primary/20"
                        : ""
                    }`}
            >
                {items.length ===
                    0 ? (
                    <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed px-4 text-center text-sm text-muted-foreground">
                        Arraste um trabalho para cá
                    </div>
                ) : (
                    items.map(
                        (
                            item,
                            index,
                        ) => (
                            <SortableWorkItem
                                key={
                                    item.id
                                }
                                item={
                                    item
                                }
                                index={
                                    index
                                }
                                group={
                                    period
                                }
                                clients={
                                    clients
                                }
                                cases={
                                    cases
                                }
                                canEdit={
                                    canEdit
                                }
                                canDelete={
                                    canDelete
                                }
                                saving={
                                    saving
                                }
                            />
                        ),
                    )
                )}
            </div>
        </section>
    );
}

export function WorkQueue({
    items,
    clients,
    cases,
    canEdit,
    canDelete,
}: WorkQueueProps) {
    const initialGroups =
        createGroups(
            items,
        );

    const [
        groups,
        setGroups,
    ] =
        useState<
            WorkQueueGroups
        >(
            initialGroups,
        );

    const [
        saving,
        setSaving,
    ] =
        useState(false);

    const groupsRef =
        useRef<
            WorkQueueGroups
        >(
            cloneGroups(
                initialGroups,
            ),
        );

    const snapshot =
        useRef<
            WorkQueueGroups
        >(
            cloneGroups(
                initialGroups,
            ),
        );

    useEffect(
        () => {
            const next =
                createGroups(
                    items,
                );

            setGroups(
                next,
            );

            groupsRef.current =
                cloneGroups(
                    next,
                );

            snapshot.current =
                cloneGroups(
                    next,
                );
        },
        [items],
    );

    return (
        <div className="space-y-4">
            {saving && (
                <div className="text-right text-xs text-muted-foreground">
                    Salvando ordem...
                </div>
            )}

            <DragDropProvider
                onDragStart={
                    () => {
                        snapshot.current =
                            cloneGroups(
                                groupsRef.current,
                            );
                    }
                }

                onDragOver={
                    (event) => {
                        if (
                            saving
                        ) {
                            return;
                        }

                        setGroups(
                            (current) => {
                                const next =
                                    move(
                                        current,
                                        event,
                                    );

                                groupsRef.current =
                                    cloneGroups(
                                        next,
                                    );

                                return next;
                            },
                        );
                    }
                }

                onDragEnd={
                    async (
                        event,
                    ) => {
                        if (
                            event.canceled
                        ) {
                            const previous =
                                cloneGroups(
                                    snapshot.current,
                                );

                            groupsRef.current =
                                cloneGroups(
                                    previous,
                                );

                            setGroups(
                                previous,
                            );

                            return;
                        }

                        if (
                            hasSameOrder(
                                snapshot.current,
                                groupsRef.current,
                            )
                        ) {
                            return;
                        }

                        const finalGroups =
                            cloneGroups(
                                groupsRef.current,
                            );

                        setSaving(
                            true,
                        );

                        try {
                            await saveWorkQueueOrderAction(
                                {
                                    [WorkPlanningPeriod.ESTA_SEMANA]:
                                        finalGroups[
                                            WorkPlanningPeriod
                                                .ESTA_SEMANA
                                        ].map(
                                            (item) =>
                                                item.id,
                                        ),

                                    [WorkPlanningPeriod.ESTE_MES]:
                                        finalGroups[
                                            WorkPlanningPeriod
                                                .ESTE_MES
                                        ].map(
                                            (item) =>
                                                item.id,
                                        ),

                                    [WorkPlanningPeriod.DEPOIS]:
                                        finalGroups[
                                            WorkPlanningPeriod
                                                .DEPOIS
                                        ].map(
                                            (item) =>
                                                item.id,
                                        ),
                                },
                            );

                            snapshot.current =
                                cloneGroups(
                                    finalGroups,
                                );
                        } catch (
                        error
                        ) {
                            console.error(
                                error,
                            );

                            const previous =
                                cloneGroups(
                                    snapshot.current,
                                );

                            groupsRef.current =
                                cloneGroups(
                                    previous,
                                );

                            setGroups(
                                previous,
                            );
                        } finally {
                            setSaving(
                                false,
                            );
                        }
                    }
                }
            >
                <div className="space-y-10">
                    <WorkSection
                        title="Esta semana"
                        period={
                            WorkPlanningPeriod.ESTA_SEMANA
                        }
                        items={
                            groups[
                            WorkPlanningPeriod
                                .ESTA_SEMANA
                            ]
                        }
                        clients={
                            clients
                        }
                        cases={
                            cases
                        }
                        canEdit={
                            canEdit
                        }
                        canDelete={
                            canDelete
                        }
                        saving={
                            saving
                        }
                    />

                    <WorkSection
                        title="Este mês"
                        period={
                            WorkPlanningPeriod.ESTE_MES
                        }
                        items={
                            groups[
                            WorkPlanningPeriod
                                .ESTE_MES
                            ]
                        }
                        clients={
                            clients
                        }
                        cases={
                            cases
                        }
                        canEdit={
                            canEdit
                        }
                        canDelete={
                            canDelete
                        }
                        saving={
                            saving
                        }
                    />

                    <WorkSection
                        title="Depois"
                        period={
                            WorkPlanningPeriod.DEPOIS
                        }
                        items={
                            groups[
                            WorkPlanningPeriod
                                .DEPOIS
                            ]
                        }
                        clients={
                            clients
                        }
                        cases={
                            cases
                        }
                        canEdit={
                            canEdit
                        }
                        canDelete={
                            canDelete
                        }
                        saving={
                            saving
                        }
                    />
                </div>
            </DragDropProvider>
        </div>
    );
}