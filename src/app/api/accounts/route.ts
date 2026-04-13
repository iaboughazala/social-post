import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = (session.user as Record<string, unknown>).teamId as string;
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  const { db } = await import("@/lib/db");

  const accounts = await db.socialAccount.findMany({
    where: { teamId, isActive: true },
    select: {
      id: true,
      platform: true,
      platformId: true,
      name: true,
      username: true,
      avatar: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ accounts });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = (session.user as Record<string, unknown>).teamId as string;
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  const { searchParams } = req.nextUrl;
  const accountId = searchParams.get("id");

  if (!accountId) {
    return NextResponse.json(
      { error: "Account ID is required" },
      { status: 400 }
    );
  }

  const { db } = await import("@/lib/db");

  // Verify the account belongs to the user's team
  const account = await db.socialAccount.findFirst({
    where: { id: accountId, teamId },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  await db.socialAccount.delete({ where: { id: accountId } });

  return NextResponse.json({ success: true });
}
