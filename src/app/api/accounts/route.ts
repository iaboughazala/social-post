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

  // Soft-delete: keep the row so historical PostAccount links (and the
  // published-history they represent) survive. Wipe the token so a leaked
  // DB dump can't be used to post. Reconnecting the same platform+platformId
  // upserts back to isActive=true with a fresh token.
  await db.socialAccount.update({
    where: { id: accountId },
    data: {
      isActive: false,
      accessToken: "",
      refreshToken: null,
      expiresAt: null,
    },
  });

  return NextResponse.json({ success: true });
}
