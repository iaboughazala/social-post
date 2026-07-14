import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Switch the caller's active team. The JWT callback re-reads
 * users.activeTeamId on the next request, so subsequent API calls are
 * automatically scoped to the new team.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as Record<string, unknown>).id as string;

  const body = await req.json().catch(() => ({}));
  const teamId = typeof body.teamId === "string" ? body.teamId : "";
  if (!teamId) {
    return NextResponse.json({ error: "teamId required" }, { status: 400 });
  }

  const { db } = await import("@/lib/db");
  const membership = await db.teamMember.findFirst({
    where: { userId, teamId },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  await db.user.update({
    where: { id: userId },
    data: { activeTeamId: teamId },
  });

  return NextResponse.json({ success: true, teamId });
}
