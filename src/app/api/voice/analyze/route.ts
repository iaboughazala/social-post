import { NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";
import { analyzeStyle } from "@/lib/voice/analyze";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await import("@/lib/db");
  const samples = await db.samplePost.findMany({
    where: { userId: s.userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (samples.length === 0) {
    return NextResponse.json(
      { error: "Add at least one sample post first" },
      { status: 400 }
    );
  }

  try {
    const { style, model } = await analyzeStyle(samples);
    const saved = await db.styleProfile.upsert({
      where: { userId: s.userId },
      create: {
        userId: s.userId,
        toneSummary: style.toneSummary,
        voicePillars: JSON.stringify(style.voicePillars),
        vocabularyNotes: style.vocabularyNotes,
        structureNotes: style.structureNotes,
        doList: JSON.stringify(style.doList),
        dontList: JSON.stringify(style.dontList),
        rawAnalysis: style.rawAnalysis,
        sourceSamples: samples.length,
        model,
      },
      update: {
        toneSummary: style.toneSummary,
        voicePillars: JSON.stringify(style.voicePillars),
        vocabularyNotes: style.vocabularyNotes,
        structureNotes: style.structureNotes,
        doList: JSON.stringify(style.doList),
        dontList: JSON.stringify(style.dontList),
        rawAnalysis: style.rawAnalysis,
        sourceSamples: samples.length,
        model,
      },
    });
    return NextResponse.json({ style: saved });
  } catch (err) {
    console.error("Voice analyze failed:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
