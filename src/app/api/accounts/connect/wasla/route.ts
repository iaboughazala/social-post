import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { encryptToken } from "@/lib/crypto";
import { WaslaClient } from "@/lib/social/wasla";

export const dynamic = "force-dynamic";

/**
 * Connect a Wasla account. Client posts { apiBase, apiKey }; we validate via
 * /me (identifies the profile the key belongs to), then upsert as a
 * SocialAccount with the pair encrypted together in accessToken.
 * apiBase is stored alongside the key so it can be overridden per-account
 * (staging, local, etc.) without a rebuild.
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
  const rawBase =
    typeof body.apiBase === "string" ? body.apiBase.trim() : "";
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

  const apiBase = rawBase || "https://wasla.ws/api/integrations/social-post";
  if (!apiKey) {
    return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
  }
  if (!/^https?:\/\//.test(apiBase)) {
    return NextResponse.json({ error: "apiBase must be a full URL" }, { status: 400 });
  }

  const client = new WaslaClient(apiBase, apiKey);

  let profile: Awaited<ReturnType<typeof client.getProfile>>;
  try {
    profile = await client.getProfile();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Wasla auth failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Pack baseUrl + apiKey together for storage (same trick used for Bluesky).
  const combined = `${apiBase}\x00${apiKey}`;

  const { db } = await import("@/lib/db");
  const account = await db.socialAccount.upsert({
    where: {
      platform_platformId: { platform: "wasla", platformId: profile.id },
    },
    create: {
      platform: "wasla",
      platformId: profile.id,
      name: profile.name,
      username: profile.handle ? `@${profile.handle}` : null,
      avatar: profile.avatar ?? null,
      accessToken: encryptToken(combined),
      refreshToken: null,
      expiresAt: null,
      teamId,
      isActive: true,
    },
    update: {
      name: profile.name,
      username: profile.handle ? `@${profile.handle}` : null,
      avatar: profile.avatar ?? null,
      accessToken: encryptToken(combined),
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
      profileUrl: profile.profileUrl,
    },
  });
}
