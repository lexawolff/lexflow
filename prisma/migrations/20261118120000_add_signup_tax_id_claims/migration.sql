-- Um CPF, ou um CNPJ com suas filiais, abre um único escritório pelo cadastro
-- público. Guarda apenas um HMAC do documento; o registro permanece mesmo se
-- os dados forem editados ou o escritório for excluído.

-- CreateTable
CREATE TABLE "SignupTaxIdClaim" (
    "taxIdHash" TEXT NOT NULL,
    "workspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignupTaxIdClaim_pkey" PRIMARY KEY ("taxIdHash")
);

-- CreateIndex
CREATE INDEX "SignupTaxIdClaim_workspaceId_idx" ON "SignupTaxIdClaim"("workspaceId");

-- AddForeignKey
ALTER TABLE "SignupTaxIdClaim" ADD CONSTRAINT "SignupTaxIdClaim_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Mesma regra das demais tabelas (20261117120000_enable_rls_all_tables):
-- sem acesso pela API pública do Supabase; o Prisma (dono) não é afetado.
ALTER TABLE "SignupTaxIdClaim" ENABLE ROW LEVEL SECURITY;
