import { NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";
import { parseSchedule, computeNextSlots } from "@/lib/voice/schedule";
import { maybeAutoAnalyze } from "@/lib/voice/auto-analyze";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Bulk-approve every AI-drafted post in the team's queue.
 * Reuses the same slot-picking + platform-linking logic as
 * /api/posts/[id]/approve, but computes all N slots in one pass so we
 * don't hit the DB N times for taken-times lookups.
 */
export async function POST() {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await import("@/lib/db");

  const drafts = await db.post.findMany({
    where: {
      teamId: s.teamId,
      status: "draft",
      sourceVariant: { isNot: null },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (drafts.length === 0) {
    return NextResponse.json({ approved: 0, skipped: "queue is empty" });
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
  if (
    !schedule.isActive ||
    schedule.days.length === 0 ||
    schedule.times.length === 0
  ) {
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

  const takenPosts = await db.post.findMany({
    where: {
      teamId: s.teamId,
      status: { in: ["scheduled", "publishing"] },
      scheduledAt: { not: null },
    },
    select: { scheduledAt: true },
  });
  const takenTimes = new Set(
    takenPosts
      .map((t) => t.scheduledAt?.getTime())
      .filter((v): v is number => typeof v === "number")
  );

  // Compute enough slots to cover the queue plus buffer for the already-taken ones.
  const candidateSlots = computeNextSlots(
    schedule,
    new Date(),
    drafts.length + takenTimes.size + 20
  );
  const openSlots: Date[] = [];
  for (const slot of candidateSlots) {
    let clash = false;
    for (const t of takenTimes) {
      if (Math.abs(t - slot.getTime()) < 60_000) {
        clash = true;
        break;
      }
    }
    if (!clash) {
      openSlots.push(slot);
      takenTimes.add(slot.getTime());
      if (openSlots.length >= drafts.length) break;
    }
  }

  if (openSlots.length === 0) {
    return NextResponse.json(
      { error: "No available slots in the next 60 days" },
      { status: 500 }
    );
  }

  const socialAccounts = await db.socialAccount.findMany({
    where: {
      teamId: s.teamId,
      isActive: true,
      platform: { in: schedule.platforms },
    },
    select: { id: true },
  });

  const approvedIds: string[] = [];
  await db.$transaction(async (tx) => {
    for (let i = 0; i < drafts.length && i < openSlots.length; i++) {
      const post = drafts[i];
      const slot = openSlots[i];
      await tx.post.update({
        where: { id: post.id },
        data: { status: "scheduled", scheduledAt: slot },
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
      // Learning corpus: keep every approved content as a sample.
      // We look up the post's content via the source variant → generation
      // chain if not already available; simpler to just read the post here.
      const p = await tx.post.findUnique({
        where: { id: post.id },
        select: { content: true },
      });
      if (p) {
        await tx.samplePost.create({
          data: {
            teamId: s.teamId,
            content: p.content,
            notes: `Approved on ${new Date().toISOString().slice(0, 10)} · post ${post.id}`,
          },
        });
      }
      approvedIds.push(post.id);
    }
  });

  // Fire-and-forget: run analyzer if we crossed the threshold.
  setImmediate(() => {
    maybeAutoAnalyze(s.teamId);
  });

  return NextResponse.json({
    approved: approvedIds.length,
    skipped: drafts.length - approvedIds.length,
    firstSlot: openSlots[0]?.toISOString() ?? null,
    lastSlot: openSlots[approvedIds.length - 1]?.toISOString() ?? null,
  });
}
