import {
  PLAN_MAX_USERS,
} from "@/lib/plans";

/*
 * Vagas da equipe no plano do LexFlow. Convites pendentes contam como vaga
 * ocupada, para não ser possível convidar além do limite.
 *
 * Escritórios sem assinatura registrada são anteriores ao plano e não têm
 * limite.
 */

export const TEAM_FULL_MESSAGE =
  `O plano do LexFlow permite até ${PLAN_MAX_USERS} usuários por escritório, contando os convites pendentes. Remova um membro ou cancele um convite para convidar outra pessoa.`;

export const TEAM_FULL_ON_ACCEPT_MESSAGE =
  `Este escritório já tem ${PLAN_MAX_USERS} usuários, o limite do plano. Peça a quem enviou o convite para liberar uma vaga.`;

export type TeamCapacity = {
  limit: number;
  used: number;
  full: boolean;
};

type CapacityDb = {
  subscription: {
    findUnique: (args: { where: { workspaceId: string }; select: { id: true } }) => Promise<{ id: string } | null>;
  };
  membership: {
    count: (args: { where: { workspaceId: string } }) => Promise<number>;
  };
  workspaceInvitation: {
    count: (args: {
      where: {
        workspaceId: string;
        acceptedAt: null;
        revokedAt: null;
        expiresAt: { gt: Date };
      };
    }) => Promise<number>;
  };
};

export async function getTeamCapacity(
  db: CapacityDb,
  workspaceId: string,
  now: Date = new Date(),
): Promise<TeamCapacity | null> {
  const subscription = await db.subscription.findUnique({
    where: { workspaceId },
    select: { id: true },
  });

  if (!subscription) {
    return null;
  }

  const [members, pending] = await Promise.all([
    db.membership.count({ where: { workspaceId } }),
    db.workspaceInvitation.count({
      where: {
        workspaceId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    }),
  ]);

  const used = members + pending;

  return {
    limit: PLAN_MAX_USERS,
    used,
    full: used >= PLAN_MAX_USERS,
  };
}

// Na entrada pelo convite só contam os membros: o próprio convite já ocupa vaga.
export async function isTeamFullForNewMember(
  db: Pick<CapacityDb, "subscription" | "membership">,
  workspaceId: string,
): Promise<boolean> {
  const subscription = await db.subscription.findUnique({
    where: { workspaceId },
    select: { id: true },
  });

  if (!subscription) {
    return false;
  }

  return (await db.membership.count({ where: { workspaceId } })) >= PLAN_MAX_USERS;
}
