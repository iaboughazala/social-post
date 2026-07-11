import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes, createHash } from "crypto";

export const dynamic = "force-dynamic";

const TWITTER_AUTH_URL = "https://x.com/i/oauth2/authorize";
const SCOPES = [
  "tweet.read",
  "tweet.write",
  "users.read",
  "media.write",
  "offline.access",
];

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = (session.user as Record<string, unknown>).teamId as string;
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (!clientId || !nextAuthUrl) {
    return NextResponse.json(
      { error: "Twitter OAuth not configured" },
      { status: 500 }
    );
  }

  const state = randomBytes(24).toString("hex");
  const codeVerifier = base64UrlEncode(randomBytes(64));
  const codeChallenge = base64UrlEncode(
    createHash("sha256").update(codeVerifier).digest()
  );
  const redirectUri = `${nextAuthUrl}/api/accounts/callback/twitter`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const res = NextResponse.redirect(`${TWITTER_AUTH_URL}?${params.toString()}`);
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };
  res.cookies.set("twitter_oauth_state", state, cookieOpts);
  res.cookies.set("twitter_oauth_verifier", codeVerifier, cookieOpts);
  res.cookies.set("twitter_oauth_team", teamId, cookieOpts);
  return res;
}
