import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { encryptToken } from "@/lib/crypto";
import { BlueskyClient } from "@/lib/social/bluesky";

export const dynamic = "force-dynamic";

/**
 * Connect a Bluesky account via handle + app password (no OAuth needed).
 * The app password lives at bsky.app → Settings → App Passwords.
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
  const handle = typeof body.handle === "string" ? body.handle.trim().replace(/^@/, "") : "";
  const appPassword =
    typeof body.appPassword === "string" ? body.appPassword.trim() : "";
  if (!handle || !appPassword) {
    return NextResponse.json(
      { error: "handle and appPassword are required" },
      { status: 400 }
    );
  }

  const client = new BlueskyClient(handle, appPassword);

  let profile: {
    did: string;
    handle: string;
    displayName: string;
    avatar: string | null;
  };
  try {
    profile = await client.getProfile();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bluesky login failed";
    return NextResponse.json(
      { error: `Bluesky login failed: ${message}` },
      { status: 400 }
    );
  }

  // Store handle:appPassword together (base64 packed inside encryption)
  const combined = `${handle}\x00${appPassword}`;

  const { db } = await import("@/lib/db");
  const account = await db.socialAccount.upsert({
    where: {
      platform_platformId: {
        platform: "bluesky",
        platformId: profile.did,
      },
    },
    create: {
      platform: "bluesky",
      platformId: profile.did,
      name: profile.displayName,
      username: `@${profile.handle}`,
      avatar: profile.avatar,
      accessToken: encryptToken(combined),
      refreshToken: null,
      expiresAt: null,
      teamId,
      isActive: true,
    },
    update: {
      name: profile.displayName,
      username: `@${profile.handle}`,
      avatar: profile.avatar,
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
    },
  });
}
