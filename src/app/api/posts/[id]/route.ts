import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const { db } = await import("@/lib/db");
  const existing = await db.post.findFirst({ where: { id, teamId: s.teamId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.status === "string") data.status = body.status;
  if (body.scheduledAt === null) data.scheduledAt = null;
  else if (typeof body.scheduledAt === "string") {
    data.scheduledAt = new Date(body.scheduledAt);
  }

  const post = await db.post.update({ where: { id }, data });
  return NextResponse.json({ post });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { db } = await import("@/lib/db");
  const existing = await db.post.findFirst({ where: { id, teamId: s.teamId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
