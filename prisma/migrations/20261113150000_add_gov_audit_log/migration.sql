BEGIN;

CREATE TYPE "AuditAction" AS ENUM (
    'GOV_PASSWORD_RELEASED_FOR_REVEAL',
    'GOV_PASSWORD_RELEASED_FOR_COPY',
    'GOV_PASSWORD_COPY_REPORTED',
    'GOV_CREDENTIAL_CREATED',
    'GOV_CREDENTIAL_UPDATED'
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "parentEventId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuditLog_parentEventId_key" ON "AuditLog"("parentEventId");
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");
CREATE INDEX "AuditLog_workspaceId_clientId_createdAt_idx" ON "AuditLog"("workspaceId", "clientId", "createdAt");
CREATE INDEX "AuditLog_workspaceId_actorUserId_createdAt_idx" ON "AuditLog"("workspaceId", "actorUserId", "createdAt");

-- Impede acesso direto por papéis sem BYPASSRLS (por exemplo, API pública).
-- O Prisma deve conectar com o papel privado do servidor, proprietário da
-- tabela ou com BYPASSRLS. Não há política de acesso para o navegador.
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

COMMIT;
