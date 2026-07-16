-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'LAWYER', 'INTERN', 'FINANCIAL', 'VIEWER');

-- CreateEnum
CREATE TYPE "PracticeArea" AS ENUM ('PREVIDENCIARIO', 'CIVEL', 'FAMILIA', 'TRABALHISTA', 'CONSUMIDOR', 'ADMINISTRATIVO', 'TRIBUTARIO', 'EMPRESARIAL', 'CRIMINAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('ATENDIMENTO_INICIAL', 'DOCUMENTACAO_PENDENTE', 'ADMINISTRATIVO', 'INICIAL_EM_ELABORACAO', 'PROTOCOLADO', 'AGUARDANDO_PERICIA', 'AGUARDANDO_SENTENCA', 'RECURSO', 'CUMPRIMENTO_SENTENCA', 'RPV_EXPEDIDA', 'RPV_PAGA', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'PARCIAL', 'CANCELADO');

-- CreateEnum
CREATE TYPE "RpvStatus" AS ENUM ('AGUARDANDO_EXPEDICAO', 'EXPEDIDA', 'AUTUADA', 'LIBERADA', 'PAGA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'ATRASADA');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('PRAZO_PROCESSUAL', 'PRORROGACAO_BENEFICIO', 'AUDIENCIA', 'PERICIA', 'DOCUMENTO_PENDENTE', 'CONTATO_CLIENTE', 'RPV', 'OUTRO');

-- CreateEnum
CREATE TYPE "ExtraServiceStatus" AS ENUM ('A_RECEBER', 'RECEBIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('RG', 'CPF', 'CNIS', 'CTPS', 'COMPROVANTE_RESIDENCIA', 'LAUDO', 'EXAME', 'RECEITA', 'ATESTADO', 'CONTRATO', 'PROCURACAO', 'PETICAO', 'SENTENCA', 'ACORDAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "ReceivableType" AS ENUM ('HONORARIO_CONTRATUAL', 'HONORARIO_SUCUMBENCIAL', 'RPV', 'ACORDO', 'CONSULTA', 'SERVICO_EXTRA', 'OUTRO');

-- CreateEnum
CREATE TYPE "PayableCategory" AS ENUM ('ALUGUEL', 'SALARIO', 'IMPOSTO', 'SOFTWARE', 'MARKETING', 'MATERIAL_ESCRITORIO', 'CUSTAS', 'OUTRO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "maritalStatus" TEXT,
    "nationality" TEXT,
    "education" TEXT,
    "profession" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "cep" TEXT,
    "address" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pis" TEXT,
    "govPasswordEncrypted" TEXT,
    "income" DECIMAL(65,30),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "practiceArea" "PracticeArea" NOT NULL,
    "subject" TEXT,
    "number" TEXT,
    "court" TEXT,
    "courtUnit" TEXT,
    "opposingParty" TEXT,
    "caseLink" TEXT,
    "value" DECIMAL(65,30),
    "status" "CaseStatus" NOT NULL DEFAULT 'ATENDIMENTO_INICIAL',
    "protocolDate" TIMESTAMP(3),
    "nextDeadline" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payable" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "PayableCategory" NOT NULL DEFAULT 'OUTRO',
    "amount" DECIMAL(65,30) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "FinancialStatus" NOT NULL DEFAULT 'PENDENTE',
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receivable" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "caseId" TEXT,
    "description" TEXT NOT NULL,
    "type" "ReceivableType" NOT NULL DEFAULT 'HONORARIO_CONTRATUAL',
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "status" "FinancialStatus" NOT NULL DEFAULT 'PENDENTE',
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rpv" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "requisitionNumber" TEXT,
    "court" TEXT,
    "grossAmount" DECIMAL(65,30) NOT NULL,
    "contractualFeeRate" DECIMAL(65,30),
    "contractualFeeValue" DECIMAL(65,30),
    "sucumbencyFeeValue" DECIMAL(65,30),
    "clientNetAmount" DECIMAL(65,30),
    "expectedPaymentDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "bank" TEXT,
    "status" "RpvStatus" NOT NULL DEFAULT 'AGUARDANDO_EXPEDICAO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rpv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT,
    "caseId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDENTE',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "startsAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraService" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "ExtraServiceStatus" NOT NULL DEFAULT 'A_RECEBER',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT,
    "caseId" TEXT,
    "name" TEXT NOT NULL,
    "category" "DocumentCategory",
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "size" INTEGER,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_workspaceId_idx" ON "Membership"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_workspaceId_key" ON "Membership"("userId", "workspaceId");

-- CreateIndex
CREATE INDEX "Client_workspaceId_idx" ON "Client"("workspaceId");

-- CreateIndex
CREATE INDEX "Client_name_idx" ON "Client"("name");

-- CreateIndex
CREATE INDEX "Client_cpf_idx" ON "Client"("cpf");

-- CreateIndex
CREATE INDEX "Case_workspaceId_idx" ON "Case"("workspaceId");

-- CreateIndex
CREATE INDEX "Case_clientId_idx" ON "Case"("clientId");

-- CreateIndex
CREATE INDEX "Case_number_idx" ON "Case"("number");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_practiceArea_idx" ON "Case"("practiceArea");

-- CreateIndex
CREATE INDEX "Payable_workspaceId_idx" ON "Payable"("workspaceId");

-- CreateIndex
CREATE INDEX "Payable_dueDate_idx" ON "Payable"("dueDate");

-- CreateIndex
CREATE INDEX "Payable_status_idx" ON "Payable"("status");

-- CreateIndex
CREATE INDEX "Payable_category_idx" ON "Payable"("category");

-- CreateIndex
CREATE INDEX "Receivable_workspaceId_idx" ON "Receivable"("workspaceId");

-- CreateIndex
CREATE INDEX "Receivable_clientId_idx" ON "Receivable"("clientId");

-- CreateIndex
CREATE INDEX "Receivable_caseId_idx" ON "Receivable"("caseId");

-- CreateIndex
CREATE INDEX "Receivable_dueDate_idx" ON "Receivable"("dueDate");

-- CreateIndex
CREATE INDEX "Receivable_status_idx" ON "Receivable"("status");

-- CreateIndex
CREATE INDEX "Receivable_type_idx" ON "Receivable"("type");

-- CreateIndex
CREATE INDEX "Rpv_workspaceId_idx" ON "Rpv"("workspaceId");

-- CreateIndex
CREATE INDEX "Rpv_caseId_idx" ON "Rpv"("caseId");

-- CreateIndex
CREATE INDEX "Rpv_expectedPaymentDate_idx" ON "Rpv"("expectedPaymentDate");

-- CreateIndex
CREATE INDEX "Rpv_status_idx" ON "Rpv"("status");

-- CreateIndex
CREATE INDEX "Task_workspaceId_idx" ON "Task"("workspaceId");

-- CreateIndex
CREATE INDEX "Task_clientId_idx" ON "Task"("clientId");

-- CreateIndex
CREATE INDEX "Task_caseId_idx" ON "Task"("caseId");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_type_idx" ON "Task"("type");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "ExtraService_workspaceId_idx" ON "ExtraService"("workspaceId");

-- CreateIndex
CREATE INDEX "ExtraService_date_idx" ON "ExtraService"("date");

-- CreateIndex
CREATE INDEX "ExtraService_status_idx" ON "ExtraService"("status");

-- CreateIndex
CREATE INDEX "Document_workspaceId_idx" ON "Document"("workspaceId");

-- CreateIndex
CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");

-- CreateIndex
CREATE INDEX "Document_caseId_idx" ON "Document"("caseId");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE INDEX "ClientEvent_workspaceId_idx" ON "ClientEvent"("workspaceId");

-- CreateIndex
CREATE INDEX "ClientEvent_clientId_idx" ON "ClientEvent"("clientId");

-- CreateIndex
CREATE INDEX "CaseEvent_workspaceId_idx" ON "CaseEvent"("workspaceId");

-- CreateIndex
CREATE INDEX "CaseEvent_caseId_idx" ON "CaseEvent"("caseId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payable" ADD CONSTRAINT "Payable_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rpv" ADD CONSTRAINT "Rpv_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rpv" ADD CONSTRAINT "Rpv_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraService" ADD CONSTRAINT "ExtraService_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientEvent" ADD CONSTRAINT "ClientEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientEvent" ADD CONSTRAINT "ClientEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
