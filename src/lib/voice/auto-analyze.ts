import { analyzeStyle } from "./analyze";

const AUTO_ANALYZE_THRESHOLD = 10;
const RECENT_ANALYZE_MS = 5 * 60 * 1000; // 5 min guard against double-fires
const SAMPLES_FOR_ANALYSIS = 15;

/**
 * If the user has accumulated >= AUTO_ANALYZE_THRESHOLD new samples since the
 * last StyleProfile update, re-analyze and upsert the profile.
 * Idempotent-ish: concurrent triggers race but converge on the same result.
 *
 * Meant to be fire-and-forgot from a request handler after a sample was added.
 * Never throws — logs failures instead so the caller stays clean.
 */
export async function maybeAutoAnalyze(userId: string): Promise<void> {
  try {
    const { db } = await import("@/lib/db");
    const [totalSamples, existing] = await Promise.all([
      db.samplePost.count({ where: { userId } }),
      db.styleProfile.findUnique({ where: { userId } }),
    ]);

    const baseline = existing?.sourceSamples ?? 0;
    const newSince = totalSamples - baseline;
    if (newSince < AUTO_ANALYZE_THRESHOLD) return;

    if (
      existing &&
      Date.now() - existing.updatedAt.getTime() < RECENT_ANALYZE_MS
    ) {
      // Another approve already triggered analysis moments ago.
      return;
    }

    const samples = await db.samplePost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: SAMPLES_FOR_ANALYSIS,
    });
    if (samples.length === 0) return;

    console.log(
      `[auto-analyze] user=${userId} totalSamples=${totalSamples} baseline=${baseline} → running analyze`
    );

    const { style, model } = await analyzeStyle(samples);

    await db.styleProfile.upsert({
      where: { userId },
      create: {
        userId,
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
        sourceSamples: totalSamples,
        model,
      },
    });

    console.log(`[auto-analyze] user=${userId} completed`);
  } catch (err) {
    console.error(
      `[auto-analyze] failed for user=${userId}:`,
      err instanceof Error ? err.message : err
    );
  }
}
