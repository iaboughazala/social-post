import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { encryptToken } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

/**
 * Connect a Facebook Page using a long-lived Page Access Token pasted by
 * the user. Same pattern that wzyfa-search uses. No OAuth, no app-level
 * pages_* permission needed.
 *
 * Flow:
 *  - Client POSTs { pageToken }
 *  - Server calls /me?fields=id,name,username,picture with that token —
 *    a valid page token returns the page's identity
 *  - Save encrypted SocialAccount(platform=facebook)
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const teamId = (session.user as Record<string, unknown>).teamId as string;
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const pageToken =
    typeof body.pageToken === "string" ? body.pageToken.trim() : "";
  if (!pageToken) {
    return NextResponse.json(
      { error: "pageToken is required" },
      { status: 400 }
    );
  }

  const url = `${GRAPH_BASE}/me?fields=id,name,username,picture&access_token=${encodeURIComponent(pageToken)}`;
  const res = await fetch(url);
  const info = await res.json().catch(() => ({}));
  if (!res.ok || info.error || !info.id || !info.name) {
    const msg =
      info?.error?.message ||
      "Token is invalid or doesn't belong to a Facebook Page";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const avatar = info.picture?.data?.url ?? null;

  const { db } = await import("@/lib/db");
  const account = await db.socialAccount.upsert({
    where: {
      platform_platformId: { platform: "facebook", platformId: info.id },
    },
    create: {
      platform: "facebook",
      platformId: info.id,
      name: info.name,
      username: info.username ? `@${info.username}` : null,
      avatar,
      accessToken: encryptToken(pageToken),
      refreshToken: null,
      expiresAt: null,
      teamId,
      isActive: true,
    },
    update: {
      name: info.name,
      username: info.username ? `@${info.username}` : null,
      avatar,
      accessToken: encryptToken(pageToken),
      refreshToken: null,
      expiresAt: null,
      teamId,
      isActive: true,
    },
  });

  return NextResponse.json({
    account: {
      id: account.id,
      platform: account.platform,
      name: account.name,
      username: account.username,
    },
  });
}
