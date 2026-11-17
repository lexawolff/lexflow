import "server-only";

import {
  createHash,
  randomBytes,
} from "node:crypto";

import {
  UserRole,
} from "@prisma/client";

/*
 * Regras dos convites para o escritório.
 *
 * O link é /convite/<token>. O token tem 256 bits aleatórios e só
 * existe no link entregue a quem convida; o banco guarda apenas o
 * hash SHA-256 (tokenHash). Por isso o link aparece uma única vez:
 * se for perdido, gera-se um novo (o anterior deixa de valer).
 */

export const INVITATION_TTL_DAYS = 7;

const TOKEN_BYTES = 32;

// base64url de 32 bytes = 43 caracteres.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type InvitationStatus =
  | "PENDENTE"
  | "EXPIRADO"
  | "ACEITO"
  | "CANCELADO";

export function hashInvitationToken(
  token: string,
): string {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

export function generateInvitationToken(): {
  token: string;
  tokenHash: string;
} {
  const token =
    randomBytes(TOKEN_BYTES).toString("base64url");

  return {
    token,
    tokenHash:
      hashInvitationToken(token),
  };
}

export function isWellFormedInvitationToken(
  token: unknown,
): token is string {
  return (
    typeof token === "string" &&
    TOKEN_PATTERN.test(token)
  );
}

export function invitationExpiresAt(
  now: Date,
): Date {
  return new Date(
    now.getTime() +
      INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
}

export function getInvitationStatus(
  invitation: {
    acceptedAt: Date | null;
    revokedAt: Date | null;
    expiresAt: Date;
  },
  now: Date,
): InvitationStatus {
  if (invitation.acceptedAt) {
    return "ACEITO";
  }

  if (invitation.revokedAt) {
    return "CANCELADO";
  }

  if (
    invitation.expiresAt.getTime() <=
    now.getTime()
  ) {
    return "EXPIRADO";
  }

  return "PENDENTE";
}

/*
 * Mesma regra da troca de função na equipe:
 * só proprietário cria/gerencia convite de proprietário;
 * administrador convida para as demais funções.
 */
export function canInviteRole(
  requesterRole: UserRole,
  role: UserRole,
): boolean {
  if (requesterRole === UserRole.OWNER) {
    return true;
  }

  if (requesterRole === UserRole.ADMIN) {
    return role !== UserRole.OWNER;
  }

  return false;
}

export function invitationUnavailableMessage(
  status: InvitationStatus | null,
): string {
  switch (status) {
    case "ACEITO":
      return "Este convite já foi utilizado. Entre com o e-mail e a senha cadastrados.";
    case "CANCELADO":
      return "Este convite foi cancelado pelo escritório. Peça um novo link.";
    case "EXPIRADO":
      return "Este convite expirou. Peça um novo link ao escritório.";
    default:
      return "Convite inválido. Confira se o link foi copiado por completo.";
  }
}
