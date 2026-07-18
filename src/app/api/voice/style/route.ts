import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await import("@/lib/db");
  const style = await db.styleProfile.findUnique({
    where: { teamId: s.teamId },
  });
  return NextResponse.json({ style });
}

/**
 * Update only the human-authored fields on the StyleProfile — right now
 * that's customInstructions. The auto-extracted fields (toneSummary,
 * pillars, do/don't lists, rawAnalysis) are owned by the analyzer and
 * shouldn't be editable here.
 *
 * Creates the row with sensible empty defaults if it doesn't exist yet
 * so the user can save instructions before running their first analyze.
 */
export async function PUT(req: NextRequest) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const customInstructions =
    typeof body.customInstructions === "string" ? body.customInstructions : "";

  const { db } = await import("@/lib/db");
  const saved = await db.styleProfile.upsert({
    where: { teamId: s.teamId },
    update: { customInstructions },
    create: {
      teamId: s.teamId,
      toneSummary: "",
      voicePillars: "[]",
      vocabularyNotes: "",
      structureNotes: "",
      doList: "[]",
      dontList: "[]",
      rawAnalysis: "",
      customInstructions,
      sourceSamples: 0,
    },
  });
  return NextResponse.json({ style: saved });
}
