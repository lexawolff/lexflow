import type {
  TaskStatus,
  TaskType,
} from "@prisma/client";

export type AgendaCaseOption = {
  id: string;
  title: string;
  number: string | null;
};

export type AgendaClientOption = {
  id: string;
  name: string;
  cases: AgendaCaseOption[];
};

export type AgendaTask = {
  id: string;

  clientId: string | null;
  clientName: string | null;

  caseId: string | null;
  caseTitle: string | null;
  caseNumber: string | null;

  title: string;
  description: string | null;

  type: TaskType;
  status: TaskStatus;

  startsAt: string | null;
  dueDate: string;

  completedAt: string | null;

  location: string | null;

  googleEventId: string | null;

  createdAt: string;
  updatedAt: string;
};

export type AgendaData = {
  todayKey: string;

  monthKey: string;

  clients: AgendaClientOption[];

  tasks: AgendaTask[];

  overdueTasks: AgendaTask[];
};