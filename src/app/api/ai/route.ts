import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";
import { buildSystemPrompt, buildGeneratePrompt } from "@/lib/voice/prompts";
import { runClaude, getGenerateModel } from "@/lib/voice/generate";
import { parseVariants } from "@/lib/voice/parse";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MIN_VARIANTS = 1;
const MAX_VARIANTS = 5;

export async function POST(request: NextRequest) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { prompt, context, topicId } = body as {
    prompt?: string;
    context?: string;
    topicId?: string;
    variantCount?: number;
  };

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const requested = typeof body.variantCount === "number" ? body.variantCount : 3;
  const variantCount = Math.min(MAX_VARIANTS, Math.max(MIN_VARIANTS, Math.floor(requested)));

  const { db } = await import("@/lib/db");

  const [styleProfile, samples, topic] = await Promise.all([
    db.styleProfile.findUnique({ where: { teamId: s.teamId } }),
    db.samplePost.findMany({
      where: { teamId: s.teamId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    topicId
      ? db.contentTopic.findFirst({ where: { id: topicId, teamId: s.teamId } })
      : Promise.resolve(null),
  ]);

  const systemPrompt = buildSystemPrompt({ styleProfile, samples, topic });
  const userPrompt = buildGeneratePrompt({
    prompt: prompt.trim(),
    context: typeof context === "string" ? context.trim() || undefined : undefined,
    variantCount,
  });

  const model = getGenerateModel();

  let raw: string;
  try {
    raw = await runClaude({
      systemPrompt,
      userPrompt,
      model,
      maxTokens: 4096,
      temperature: 0.85,
    });
  } catch (err) {
    console.error("Voice generation failed:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const parsed = parseVariants(raw);
  if (parsed.length === 0) {
    return NextResponse.json(
      { error: "Model returned no variants", raw },
      { status: 502 }
    );
  }

  const generation = await db.generation.create({
    data: {
      userId: s.userId,
      teamId: s.teamId,
      topicId: topic?.id ?? null,
      prompt: prompt.trim(),
      context: typeof context === "string" ? context.trim() || null : null,
      variantCount: parsed.length,
      rawResponse: raw,
      model,
      variants: {
        create: parsed.map((v, i) => ({
          variantIndex: i,
          content: v.content,
          hook: v.hook,
          hashtags: JSON.stringify(v.hashtags),
        })),
      },
    },
    include: { variants: { orderBy: { variantIndex: "asc" } } },
  });

  return NextResponse.json({
    generationId: generation.id,
    variants: generation.variants.map((v) => ({
      id: v.id,
      variantIndex: v.variantIndex,
      content: v.content,
      hook: v.hook,
      hashtags: v.hashtags ? (JSON.parse(v.hashtags) as string[]) : [],
    })),
  });
}
