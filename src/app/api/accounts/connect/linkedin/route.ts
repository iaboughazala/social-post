import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const SCOPES = ["openid", "profile", "email", "w_member_social"];

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = (session.user as Record<string, unknown>).teamId as string;
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (!clientId || !nextAuthUrl) {
    return NextResponse.json(
      { error: "LinkedIn OAuth not configured" },
      { status: 500 }
    );
  }

  const state = randomBytes(24).toString("hex");
  const redirectUri = `${nextAuthUrl}/api/accounts/callback/linkedin`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "),
    state,
  });

  const res = NextResponse.redirect(`${LINKEDIN_AUTH_URL}?${params.toString()}`);
  res.cookies.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  res.cookies.set("linkedin_oauth_team", teamId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
