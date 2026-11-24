import "server-only";

import {
  LEGAL_CONTACT_EMAIL,
} from "@/features/legal/legal-info";

import {
  getAppUrl,
  sendEmail,
} from "@/lib/email";

import {
  formatDate,
} from "@/lib/format/date";

import {
  prisma,
} from "@/lib/prisma";

import {
  getPlannedTrialDeletionAt,
  getTrialNoticeStage,
  getTrialNoticeWindows,
} from "@/lib/trial";

import {
  buildTrialDeletionNotice,
} from "../emails/trial-deletion-notice";

// Margem dentro do limite diário do plano gratuito do Resend.
const NOTICES_PER_RUN = 40;

/*
 * Avisa os proprietários de escritórios com teste vencido e sem assinatura:
 * um e-mail 30 dias antes da exclusão e outro 7 dias antes.
 */
export async function sendTrialDeletionNotices(
  now: Date = new Date(),
) {
  const { firstNoticeFrom, finalNoticeFrom } = getTrialNoticeWindows(now);

  const candidates = await prisma.subscription.findMany({
    where: {
      status: "TRIALING",
      trialDeletionFinalNoticeAt: null,
      trialEndsAt: { lte: firstNoticeFrom },
      OR: [
        { trialDeletionNoticeAt: null },
        { trialEndsAt: { lte: finalNoticeFrom } },
      ],
    },
    orderBy: { trialEndsAt: "asc" },
    take: NOTICES_PER_RUN,
    select: {
      id: true,
      workspaceId: true,
      trialEndsAt: true,
      trialDeletionNoticeAt: true,
      workspace: {
        select: {
          name: true,
          members: {
            where: { role: "OWNER" },
            select: { user: { select: { email: true } } },
          },
        },
      },
    },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const subscription of candidates) {
    if (!subscription.trialEndsAt) {
      continue;
    }

    const stage = getTrialNoticeStage({
      trialEndsAt: subscription.trialEndsAt,
      noticeAt: subscription.trialDeletionNoticeAt,
      finalNoticeAt: null,
      now,
    });

    if (!stage) {
      continue;
    }

    // Quem recebe o último aviso não precisa mais do primeiro.
    const sentAt = stage === "final"
      ? { trialDeletionNoticeAt: subscription.trialDeletionNoticeAt ?? now, trialDeletionFinalNoticeAt: now }
      : { trialDeletionNoticeAt: now };

    const recipients = subscription.workspace.members.map((member) => member.user.email);

    try {
      // Escritório sem proprietário: não há a quem avisar.
      if (recipients.length === 0) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { trialDeletionNoticeAt: subscription.trialDeletionNoticeAt ?? now, trialDeletionFinalNoticeAt: now },
        });
        skipped += 1;
        continue;
      }

      const notice = buildTrialDeletionNotice({
        stage,
        officeName: subscription.workspace.name,
        trialEndDate: formatDate(subscription.trialEndsAt),
        deletionDate: formatDate(
          getPlannedTrialDeletionAt({
            trialEndsAt: subscription.trialEndsAt,
            finalNoticeAt: stage === "final" ? now : null,
          }),
        ),
        appUrl: getAppUrl(),
        contactEmail: LEGAL_CONTACT_EMAIL,
      });

      await sendEmail({
        to: recipients,
        subject: notice.subject,
        html: notice.html,
        text: notice.text,
        replyTo: LEGAL_CONTACT_EMAIL,
        idempotencyKey: `trial-deletion-${stage}-${subscription.id}`,
      });

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: sentAt,
      });

      sent += 1;
    } catch {
      failed += 1;
      console.error("Falha ao avisar sobre exclusão de teste vencido:", subscription.workspaceId);
    }
  }

  return { sent, skipped, failed };
}
