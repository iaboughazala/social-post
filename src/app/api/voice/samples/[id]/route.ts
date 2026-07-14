import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { db } = await import("@/lib/db");
  const existing = await db.samplePost.findFirst({
    where: { id, teamId: s.teamId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.samplePost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
