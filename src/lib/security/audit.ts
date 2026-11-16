import type { AuditAction, Prisma } from "@prisma/client";

type AuditEntry = {
  workspaceId: string;
  actorUserId: string;
  clientId: string;
  action: AuditAction;
};

// Uso interno do servidor. Não aceita senha, login, FormData ou metadados livres.
export async function recordGovAudit(
  db: Pick<Prisma.TransactionClient, "auditLog">,
  entry: AuditEntry,
) {
  return db.auditLog.create({
    data: {
      workspaceId: entry.workspaceId,
      actorUserId: entry.actorUserId,
      clientId: entry.clientId,
      action: entry.action,
    },
    select: { id: true },
  });
}
