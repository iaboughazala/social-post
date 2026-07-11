import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

const FB_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth";
const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "pages_manage_metadata",
];

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = (session.user as Record<string, unknown>).teamId as string;
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (!appId || !nextAuthUrl) {
    return NextResponse.json(
      { error: "Facebook OAuth not configured" },
      { status: 500 }
    );
  }

  const state = randomBytes(24).toString("hex");
  const redirectUri = `${nextAuthUrl}/api/accounts/callback/facebook`;

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: SCOPES.join(","),
    response_type: "code",
    state,
  });

  const res = NextResponse.redirect(`${FB_AUTH_URL}?${params.toString()}`);
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };
  res.cookies.set("fb_oauth_state", state, cookieOpts);
  res.cookies.set("fb_oauth_team", teamId, cookieOpts);
  return res;
}
