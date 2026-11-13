import {
  Prisma,
} from "@prisma/client";

/*
 * Representa os dados depois
 * de serializePrisma().
 *
 * Date -> string ISO
 * Decimal -> string | number
 */
type Serialized<T> =
  T extends Date
    ? string
    : T extends bigint
      ? string
      : T extends Prisma.Decimal
        ? string | number
        : T extends Array<infer U>
          ? Serialized<U>[]
          : T extends object
            ? {
                [K in keyof T]:
                  Serialized<T[K]>;
              }
            : T;

/*
 * ==========================
 * CASOS DO CLIENTE
 * ==========================
 *
 * nextDeadline foi removido.
 * A fonte de prazos é Task.
 */
export const clientCaseSelect =
  Prisma.validator<Prisma.CaseSelect>()({
    id:
      true,

    title:
      true,

    practiceArea:
      true,

    status:
      true,

    number:
      true,

    administrativeNumber:
      true,

    createdAt:
      true,
  });

/*
 * ==========================
 * AGENDA
 * ==========================
 */
export const clientTaskSelect =
  Prisma.validator<Prisma.TaskSelect>()({
    id:
      true,

    title:
      true,

    type:
      true,

    status:
      true,

    startsAt:
      true,

    dueDate:
      true,

    location:
      true,

    caseId:
      true,

    case: {
      select: {
        id:
          true,

        title:
          true,

        number:
          true,

        administrativeNumber:
          true,
      },
    },
  });

/*
 * ==========================
 * DOCUMENTOS
 * ==========================
 */
export const clientDocumentSelect =
  Prisma.validator<Prisma.DocumentSelect>()({
    id:
      true,

    workspaceId:
      true,

    clientId:
      true,

    originalName:
      true,

    storagePath:
      true,

    fileType:
      true,

    size:
      true,

    category:
      true,

    uploadedBy:
      true,

    createdAt:
      true,
  });

/*
 * ==========================
 * DADOS BÁSICOS
 * ==========================
 *
 * Não entram aqui:
 *
 * - income
 * - govLogin
 * - govPasswordEncrypted
 * - tasks
 * - documents
 * - receivables
 *
 * Esses dados serão buscados
 * somente quando autorizados.
 */
export const clientDashboardBaseSelect =
  Prisma.validator<Prisma.ClientSelect>()({
    id:
      true,

    workspaceId:
      true,

    name:
      true,

    cpf:
      true,

    rg:
      true,

    birthDate:
      true,

    motherName:
      true,

    fatherName:
      true,

    gender:
      true,

    maritalStatus:
      true,

    nationality:
      true,

    education:
      true,

    profession:
      true,

    phone:
      true,

    whatsapp:
      true,

    email:
      true,

    cep:
      true,

    address:
      true,

    addressNumber:
      true,

    complement:
      true,

    neighborhood:
      true,

    city:
      true,

    state:
      true,

    pis:
      true,

    notes:
      true,

    createdAt:
      true,

    updatedAt:
      true,

    cases: {
      select:
        clientCaseSelect,

      orderBy: {
        createdAt:
          "desc",
      },
    },

    timelineEvents: {
      orderBy: {
        createdAt:
          "desc",
      },
    },

    events: {
      orderBy: {
        date:
          "desc",
      },
    },
  });

type RawClientBase =
  Prisma.ClientGetPayload<{
    select:
      typeof clientDashboardBaseSelect;
  }>;

type RawClientTask =
  Prisma.TaskGetPayload<{
    select:
      typeof clientTaskSelect;
  }>;

type RawClientDocument =
  Prisma.DocumentGetPayload<{
    select:
      typeof clientDocumentSelect;
  }>;

type RawClientReceivable =
  Prisma.ReceivableGetPayload<
    Prisma.ReceivableDefaultArgs
  >;

/*
 * Estrutura completa usada
 * internamente pelo service.
 *
 * Os campos protegidos continuam
 * existindo no tipo, mas recebem
 * null/[] quando não autorizados.
 */
export type RawClientDetails =
  RawClientBase & {
    income:
      number | null;

    govLogin:
      string | null;

    hasGovPassword:
      boolean;

    tasks:
      RawClientTask[];

    documents:
      RawClientDocument[];

    receivables:
      RawClientReceivable[];
  };

/*
 * Estrutura entregue aos componentes.
 */
export type ClientDetails =
  Serialized<RawClientDetails>;