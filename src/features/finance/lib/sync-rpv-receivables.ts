import {
  FinancialStatus,
  Prisma,
  ReceivableType,
  RpvStatus,
  RpvType,
} from "@prisma/client";

type SyncRpvReceivablesParams = {
  tx: Prisma.TransactionClient;

  workspaceId: string;

  rpvId: string;
};

type SyncRpvReceivablesResult = {
  clientId: string;

  caseId: string;
};

type FeeDefinition = {
  type: ReceivableType;

  amount: number;

  description: string;

  candidateLabel: string;
};

function roundMoney(
  value: number,
): number {
  return (
    Math.round(
      (value + Number.EPSILON) *
        100,
    ) / 100
  );
}

function getRpvTypeLabel(
  type: RpvType,
): string {
  return type ===
    RpvType.PRECATORIO
    ? "Precatório"
    : "RPV";
}

function buildDescription({
  feeLabel,
  rpvType,
  requisitionNumber,
}: {
  feeLabel: string;

  rpvType: RpvType;

  requisitionNumber:
    string | null;
}): string {
  const requisitionLabel =
    getRpvTypeLabel(rpvType);

  if (requisitionNumber) {
    return `${feeLabel} - ${requisitionLabel} ${requisitionNumber}`;
  }

  return `${feeLabel} - ${requisitionLabel}`;
}

function getContractualFee({
  grossAmount,
  contractualFeeRate,
  contractualFeeValue,
}: {
  grossAmount: number;

  contractualFeeRate:
    number | null;

  contractualFeeValue:
    number | null;
}): number {
  if (
    contractualFeeValue !==
    null
  ) {
    return roundMoney(
      contractualFeeValue,
    );
  }

  if (
    contractualFeeRate !==
    null
  ) {
    return roundMoney(
      grossAmount *
        (contractualFeeRate /
          100),
    );
  }

  return 0;
}

async function findAdoptableReceivable({
  tx,
  workspaceId,
  clientId,
  caseId,
  type,
  amount,
  candidateLabel,
}: {
  tx: Prisma.TransactionClient;

  workspaceId: string;

  clientId: string;

  caseId: string;

  type: ReceivableType;

  amount: number;

  candidateLabel: string;
}) {
  const candidates =
    await tx.receivable.findMany({
      where: {
        workspaceId,

        clientId,

        caseId,

        rpvId: null,

        type,

        totalAmount:
          amount,

        status: {
          not:
            FinancialStatus.CANCELADO,
        },
      },

      select: {
        id: true,
      },

      orderBy: {
        createdAt:
          "desc",
      },

      take: 2,
    });

  if (
    candidates.length >
    1
  ) {
    throw new Error(
      `Há mais de um recebimento de ${candidateLabel} no mesmo processo com o valor de ${amount.toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL",
        },
      )}. Para evitar duplicidade financeira, o LexFlow não escolheu automaticamente qual deles pertence a esta requisição. Ajuste os lançamentos duplicados e tente novamente.`,
    );
  }

  return (
    candidates[0] ??
    null
  );
}

async function syncFee({
  tx,
  workspaceId,
  rpvId,
  clientId,
  caseId,
  rpvStatus,
  paidAt,
  fee,
}: {
  tx: Prisma.TransactionClient;

  workspaceId: string;

  rpvId: string;

  clientId: string;

  caseId: string;

  rpvStatus: RpvStatus;

  paidAt: Date | null;

  fee: FeeDefinition;
}) {
  let linkedReceivable =
    await tx.receivable.findFirst({
      where: {
        workspaceId,

        rpvId,

        type:
          fee.type,
      },

      select: {
        id: true,
      },
    });

  /*
   * Honorário removido da
   * requisição.
   *
   * Se já existia um lançamento
   * vinculado, mantemos o histórico
   * mas o cancelamos.
   */
  if (fee.amount <= 0) {
    if (linkedReceivable) {
      await tx.receivable.update({
        where: {
          id:
            linkedReceivable.id,
        },

        data: {
          paidAmount: 0,

          receivedAt: null,

          paymentMethod:
            null,

          status:
            FinancialStatus.CANCELADO,
        },
      });
    }

    return;
  }

  /*
   * Se a requisição ainda não foi
   * paga, não criamos uma receita
   * nova.
   *
   * Caso já exista uma receita
   * vinculada por um pagamento
   * anterior, ela fica cancelada
   * até que a requisição seja
   * novamente marcada como paga.
   */
  if (
    rpvStatus !==
    RpvStatus.PAGA
  ) {
    if (linkedReceivable) {
      await tx.receivable.update({
        where: {
          id:
            linkedReceivable.id,
        },

        data: {
          totalAmount:
            fee.amount,

          paidAmount: 0,

          receivedAt: null,

          paymentMethod:
            null,

          status:
            FinancialStatus.CANCELADO,
        },
      });
    }

    return;
  }

  if (!paidAt) {
    throw new Error(
      "A requisição está marcada como paga, mas não possui data de pagamento.",
    );
  }

  /*
   * Ainda não existe vínculo.
   *
   * Antes de criar um novo
   * recebimento, procuramos um
   * lançamento manual compatível.
   */
  if (!linkedReceivable) {
    const candidate =
      await findAdoptableReceivable({
        tx,

        workspaceId,

        clientId,

        caseId,

        type:
          fee.type,

        amount:
          fee.amount,

        candidateLabel:
          fee.candidateLabel,
      });

    if (candidate) {
      linkedReceivable =
        await tx.receivable.update({
          where: {
            id:
              candidate.id,
          },

          data: {
            rpvId,
          },

          select: {
            id: true,
          },
        });
    }
  }

  /*
   * Nenhum lançamento manual
   * correspondente foi encontrado.
   * Criamos um novo.
   */
  if (!linkedReceivable) {
    linkedReceivable =
      await tx.receivable.create({
        data: {
          workspaceId,

          clientId,

          caseId,

          rpvId,

          description:
            fee.description,

          type:
            fee.type,

          totalAmount:
            fee.amount,

          paidAmount:
            fee.amount,

          receivedAt:
            paidAt,

          status:
            FinancialStatus.PAGO,

          paymentMethod:
            "OUTRO",

          notes:
            "Recebimento vinculado automaticamente ao pagamento de RPV/Precatório.",
        },

        select: {
          id: true,
        },
      });

    return;
  }

  /*
   * O lançamento já existe ou foi
   * adotado.
   *
   * Sincronizamos os dados
   * financeiros com a requisição.
   */
  await tx.receivable.update({
    where: {
      id:
        linkedReceivable.id,
    },

    data: {
      clientId,

      caseId,

      totalAmount:
        fee.amount,

      paidAmount:
        fee.amount,

      receivedAt:
        paidAt,

      status:
        FinancialStatus.PAGO,

      paymentMethod:
        "OUTRO",
    },
  });
}

export async function syncRpvReceivables({
  tx,
  workspaceId,
  rpvId,
}: SyncRpvReceivablesParams): Promise<SyncRpvReceivablesResult> {
  const rpv =
    await tx.rpv.findFirst({
      where: {
        id:
          rpvId,

        workspaceId,
      },

      select: {
        id: true,

        type: true,

        requisitionNumber:
          true,

        grossAmount:
          true,

        contractualFeeRate:
          true,

        contractualFeeValue:
          true,

        sucumbencyFeeValue:
          true,

        status: true,

        paidAt: true,

        caseId: true,

        case: {
          select: {
            clientId:
              true,
          },
        },
      },
    });

  if (!rpv) {
    throw new Error(
      "Requisição não encontrada.",
    );
  }

  const grossAmount =
    Number(
      rpv.grossAmount,
    );

  const contractualFee =
    getContractualFee({
      grossAmount,

      contractualFeeRate:
        rpv.contractualFeeRate ===
        null
          ? null
          : Number(
              rpv.contractualFeeRate,
            ),

      contractualFeeValue:
        rpv.contractualFeeValue ===
        null
          ? null
          : Number(
              rpv.contractualFeeValue,
            ),
    });

  const sucumbencyFee =
    rpv.sucumbencyFeeValue ===
    null
      ? 0
      : roundMoney(
          Number(
            rpv.sucumbencyFeeValue,
          ),
        );

  const fees: FeeDefinition[] =
    [
      {
        type:
          ReceivableType.HONORARIO_CONTRATUAL,

        amount:
          contractualFee,

        description:
          buildDescription({
            feeLabel:
              "Honorários contratuais",

            rpvType:
              rpv.type,

            requisitionNumber:
              rpv.requisitionNumber,
          }),

        candidateLabel:
          "honorários contratuais",
      },

      {
        type:
          ReceivableType.HONORARIO_SUCUMBENCIAL,

        amount:
          sucumbencyFee,

        description:
          buildDescription({
            feeLabel:
              "Honorários sucumbenciais",

            rpvType:
              rpv.type,

            requisitionNumber:
              rpv.requisitionNumber,
          }),

        candidateLabel:
          "honorários sucumbenciais",
      },
    ];

  for (
    const fee of fees
  ) {
    await syncFee({
      tx,

      workspaceId,

      rpvId:
        rpv.id,

      clientId:
        rpv.case.clientId,

      caseId:
        rpv.caseId,

      rpvStatus:
        rpv.status,

      paidAt:
        rpv.paidAt,

      fee,
    });
  }

  return {
    clientId:
      rpv.case.clientId,

    caseId:
      rpv.caseId,
  };
}