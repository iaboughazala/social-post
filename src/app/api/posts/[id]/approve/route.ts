import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";
import { parseSchedule, pickNextOpenSlot } from "@/lib/voice/schedule";

export const dynamic = "force-dynamic";

/**
 * Approve a draft post: computes next open slot from the team's publishing
 * schedule, sets scheduledAt + status="scheduled", and links the post to the
 * active social accounts matching the schedule's platforms.
 * The existing /api/cron/publish will pick it up when the time comes.
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { db } = await import("@/lib/db");

  const post = await db.post.findFirst({ where: { id, teamId: s.teamId } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (post.status !== "draft") {
    return NextResponse.json(
      { error: `Post is already ${post.status}` },
      { status: 400 }
    );
  }

  const rawSchedule = await db.publishingSchedule.findUnique({
    where: { teamId: s.teamId },
  });
  if (!rawSchedule) {
    return NextResponse.json(
      { error: "No publishing schedule configured. Set it up first." },
      { status: 400 }
    );
  }
  const schedule = parseSchedule(rawSchedule);
  if (!schedule.isActive || schedule.days.length === 0 || schedule.times.length === 0) {
    return NextResponse.json(
      { error: "Publishing schedule is empty or disabled" },
      { status: 400 }
    );
  }
  if (schedule.platforms.length === 0) {
    return NextResponse.json(
      { error: "Schedule has no platforms selected" },
      { status: 400 }
    );
  }

  // Find already-scheduled/publishing posts to avoid slot collisions
  const taken = await db.post.findMany({
    where: {
      teamId: s.teamId,
      status: { in: ["scheduled", "publishing"] },
      scheduledAt: { not: null },
    },
    select: { scheduledAt: true },
  });
  const takenTimes = taken
    .map((t) => t.scheduledAt)
    .filter((d): d is Date => d instanceof Date);

  const slot = pickNextOpenSlot(schedule, new Date(), takenTimes);
  if (!slot) {
    return NextResponse.json(
      { error: "No available slot in the next 60 days" },
      { status: 500 }
    );
  }

  // Link to active social accounts matching schedule platforms
  const socialAccounts = await db.socialAccount.findMany({
    where: {
      teamId: s.teamId,
      isActive: true,
      platform: { in: schedule.platforms },
    },
    select: { id: true },
  });

  await db.$transaction(async (tx) => {
    await tx.post.update({
      where: { id: post.id },
      data: {
        status: "scheduled",
        scheduledAt: slot,
      },
    });
    // Wipe any existing links, then re-link to the current platform set
    await tx.postAccount.deleteMany({ where: { postId: post.id } });
    if (socialAccounts.length > 0) {
      await tx.postAccount.createMany({
        data: socialAccounts.map((acc) => ({
          postId: post.id,
          socialAccountId: acc.id,
        })),
      });
    }
    // Continuous learning: feed approved content back into samples so the
    // voice keeps evolving toward what the user actually greenlights.
    await tx.samplePost.create({
      data: {
        userId: s.userId,
        content: post.content,
        notes: `Approved on ${new Date().toISOString().slice(0, 10)}${post.id ? ` · post ${post.id}` : ""}`,
      },
    });
  });

  return NextResponse.json({
    postId: post.id,
    scheduledAt: slot.toISOString(),
    platforms: schedule.platforms,
    accountsLinked: socialAccounts.length,
  });
}
