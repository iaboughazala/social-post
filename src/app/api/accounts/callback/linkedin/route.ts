import { NextRequest, NextResponse } from "next/server";
import { encryptToken } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

function errorRedirect(baseUrl: string, code: string) {
  return NextResponse.redirect(`${baseUrl}/en/accounts?error=${code}`);
}

export async function GET(req: NextRequest) {
  const nextAuthUrl = process.env.NEXTAUTH_URL || "";
  const { searchParams } = req.nextUrl;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const linkedInError = searchParams.get("error");

  if (linkedInError) {
    return errorRedirect(nextAuthUrl, `linkedin_${linkedInError}`);
  }

  const stateCookie = req.cookies.get("linkedin_oauth_state")?.value;
  const teamId = req.cookies.get("linkedin_oauth_team")?.value;

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return errorRedirect(nextAuthUrl, "state_mismatch");
  }
  if (!teamId) {
    return errorRedirect(nextAuthUrl, "no_team");
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return errorRedirect(nextAuthUrl, "not_configured");
  }

  const redirectUri = `${nextAuthUrl}/api/accounts/callback/linkedin`;

  // Exchange code for access token
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    console.error("LinkedIn token exchange failed:", tokenData);
    return errorRedirect(nextAuthUrl, "token_exchange_failed");
  }

  const accessToken = tokenData.access_token as string;
  const refreshToken = (tokenData.refresh_token as string) || null;
  const expiresIn = (tokenData.expires_in as number) || 0;
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

  // Fetch profile (OpenID userinfo)
  const userinfoRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const userinfo = await userinfoRes.json();
  if (!userinfoRes.ok || !userinfo.sub) {
    console.error("LinkedIn userinfo failed:", userinfo);
    return errorRedirect(nextAuthUrl, "userinfo_failed");
  }

  const platformId = userinfo.sub as string;
  const displayName =
    (userinfo.name as string) ||
    [userinfo.given_name, userinfo.family_name].filter(Boolean).join(" ") ||
    "LinkedIn User";
  const avatar = (userinfo.picture as string) || null;
  const emailUsername = userinfo.email as string | undefined;

  const { db } = await import("@/lib/db");

  await db.socialAccount.upsert({
    where: {
      platform_platformId: {
        platform: "linkedin",
        platformId,
      },
    },
    create: {
      platform: "linkedin",
      platformId,
      name: displayName,
      username: emailUsername || null,
      avatar,
      accessToken: encryptToken(accessToken),
      refreshToken: refreshToken ? encryptToken(refreshToken) : null,
      expiresAt,
      teamId,
      isActive: true,
    },
    update: {
      name: displayName,
      username: emailUsername || null,
      avatar,
      accessToken: encryptToken(accessToken),
      refreshToken: refreshToken ? encryptToken(refreshToken) : null,
      expiresAt,
      teamId,
      isActive: true,
    },
  });

  const res = NextResponse.redirect(`${nextAuthUrl}/en/accounts?connected=linkedin`);
  res.cookies.delete("linkedin_oauth_state");
  res.cookies.delete("linkedin_oauth_team");
  return res;
}
