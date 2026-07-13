import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface VoiceSession {
  userId: string;
  teamId: string;
}

/**
 * Resolve the current voice-engine session: authenticated user + their team.
 * Returns null when either is missing (callers respond with 401/400).
 */
export async function getVoiceSession(): Promise<VoiceSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const user = session.user as Record<string, unknown>;
  const userId = user.id as string | undefined;
  const teamId = user.teamId as string | undefined;
  if (!userId || !teamId) return null;
  return { userId, teamId };
}
