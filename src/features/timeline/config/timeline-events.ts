import type { LucideIcon } from "lucide-react";
import {
  DollarSign,
  FileText,
  FolderKanban,
  Trash2,
  User,
} from "lucide-react";

import { TimelineEventType } from "@prisma/client";

type TimelineEventConfig = {
  icon: LucideIcon;
  className: string;
};

export const timelineEvents: Record<
  TimelineEventType,
  TimelineEventConfig
> = {
  CLIENT_CREATED: {
    icon: User,
    className:
      "bg-green-100 text-green-700",
  },

  CLIENT_UPDATED: {
    icon: User,
    className:
      "bg-blue-100 text-blue-700",
  },

  CASE_CREATED: {
    icon: FolderKanban,
    className:
      "bg-violet-100 text-violet-700",
  },

  CASE_UPDATED: {
    icon: FolderKanban,
    className:
      "bg-violet-100 text-violet-700",
  },

  CASE_STATUS_CHANGED: {
    icon: FolderKanban,
    className:
      "bg-amber-100 text-amber-700",
  },

  DOCUMENT_UPLOADED: {
    icon: FileText,
    className:
      "bg-sky-100 text-sky-700",
  },

  DOCUMENT_DELETED: {
    icon: Trash2,
    className:
      "bg-red-100 text-red-700",
  },

  FINANCIAL_CREATED: {
    icon: DollarSign,
    className:
      "bg-emerald-100 text-emerald-700",
  },

  FINANCIAL_UPDATED: {
    icon: DollarSign,
    className:
      "bg-emerald-100 text-emerald-700",
  },

  FINANCIAL_PAID: {
    icon: DollarSign,
    className:
      "bg-green-100 text-green-700",
  },

  TASK_CREATED: {
    icon: User,
    className:
      "bg-indigo-100 text-indigo-700",
  },

  TASK_COMPLETED: {
    icon: User,
    className:
      "bg-lime-100 text-lime-700",
  },

  NOTE_CREATED: {
    icon: FileText,
    className:
      "bg-gray-100 text-gray-700",
  },

  SYSTEM: {
    icon: User,
    className:
      "bg-muted text-muted-foreground",
  },
};