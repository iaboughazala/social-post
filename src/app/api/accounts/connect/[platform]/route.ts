import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CALLBACK_BASE = `${process.env.NEXTAUTH_URL}/api/accounts/callback`;

const PLATFORM_CONFIG: Record<
  string,
  {
    authUrl: string;
    clientIdEnv: string;
    scopes: string;
  }
> = {
  facebook: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    clientIdEnv: "FACEBOOK_CLIENT_ID",
    scopes:
      "pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish",
  },
  twitter: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    clientIdEnv: "TWITTER_CLIENT_ID",
    scopes: "tweet.read tweet.write users.read offline.access",
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    scopes: "openid profile w_member_social",
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = await params;
  const config = PLATFORM_CONFIG[platform];

  if (!config) {
    return NextResponse.json(
      { error: `Unsupported platform: ${platform}` },
      { status: 400 }
    );
  }

  const clientId = process.env[config.clientIdEnv];
  if (!clientId) {
    return NextResponse.json(
      { error: `Missing ${config.clientIdEnv} environment variable` },
      { status: 500 }
    );
  }

  const callbackUrl = `${CALLBACK_BASE}/${platform}`;
  const state = Buffer.from(
    JSON.stringify({
      teamId: (session.user as Record<string, unknown>).teamId,
      userId: (session.user as Record<string, unknown>).id,
    })
  ).toString("base64url");

  let authorizationUrl: string;

  if (platform === "twitter") {
    // Twitter uses PKCE with code_challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = codeVerifier; // plain method for simplicity

    const { db } = await import("@/lib/db");
    // Store code_verifier in a temporary way (using session state)
    // For production, use a proper session store or encrypted cookie
    const searchParams = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: config.scopes,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "plain",
    });
    authorizationUrl = `${config.authUrl}?${searchParams.toString()}`;
  } else {
    const searchParams = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: config.scopes,
      state,
    });
    authorizationUrl = `${config.authUrl}?${searchParams.toString()}`;
  }

  return NextResponse.redirect(authorizationUrl);
}

function generateCodeVerifier(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const values = new Uint8Array(64);
  crypto.getRandomValues(values);
  for (const val of values) {
    result += chars[val % chars.length];
  }
  return result;
}
