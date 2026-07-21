import { parseSchedule, computeNextSlots } from "./schedule";

/**
 * Re-slot every future scheduled post for the team against the current
 * publishing schedule. Preserves the existing queue order (oldest scheduledAt
 * first stays at the head), just reassigns the concrete slots and re-links
 * social accounts to the schedule's current platform set.
 *
 * Called after PUT /api/voice/schedule so schedule edits propagate.
 * Called after DELETE from the queue so gaps close up.
 *
 * Idempotent-safe: if there is no active schedule the posts are left alone
 * (do not orphan them).
 */
export async function reslotTeam(teamId: string): Promise<{
  reslotted: number;
  skipped?: string;
}> {
  const { db } = await import("@/lib/db");

  const rawSchedule = await db.publishingSchedule.findUnique({
    where: { teamId },
  });
  if (!rawSchedule) {
    return { reslotted: 0, skipped: "no schedule" };
  }
  const schedule = parseSchedule(rawSchedule);
  if (
    !schedule.isActive ||
    schedule.days.length === 0 ||
    schedule.times.length === 0 ||
    schedule.platforms.length === 0
  ) {
    return { reslotted: 0, skipped: "schedule empty or disabled" };
  }

  // Freeze posts already in the middle of publishing; only touch pure "scheduled".
  const posts = await db.post.findMany({
    where: { teamId, status: "scheduled" },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (posts.length === 0) return { reslotted: 0 };

  const slots = computeNextSlots(schedule, new Date(), posts.length);
  if (slots.length < posts.length) {
    // Not enough slots inside the horizon for the whole queue — reslot what we can.
    // Remaining posts stay with their old scheduledAt so nothing gets orphaned.
  }

  const socialAccounts = await db.socialAccount.findMany({
    where: {
      teamId,
      isActive: true,
      platform: { in: schedule.platforms },
    },
    select: { id: true },
  });

  await db.$transaction(async (tx) => {
    for (let i = 0; i < posts.length && i < slots.length; i++) {
      const post = posts[i];
      const slot = slots[i];
      await tx.post.update({
        where: { id: post.id },
        data: { scheduledAt: slot },
      });
      await tx.postAccount.deleteMany({ where: { postId: post.id } });
      if (socialAccounts.length > 0) {
        await tx.postAccount.createMany({
          data: socialAccounts.map((acc) => ({
            postId: post.id,
            socialAccountId: acc.id,
          })),
        });
      }
    }
  });

  return { reslotted: Math.min(posts.length, slots.length) };
}
