import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";
import { buildSystemPrompt, buildGeneratePrompt } from "@/lib/voice/prompts";
import { runClaude, getGenerateModel } from "@/lib/voice/generate";
import { parseVariants } from "@/lib/voice/parse";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Regenerate a scheduled post's content using the voice engine, taking
 * the current text as the seed idea. Does NOT persist — the client saves
 * via the existing PATCH /api/posts/[id] if the user accepts the result.
 *
 * Topic + narrative are inherited from the post's source Generation when
 * present, otherwise fall back to the team's first active topic/narrative
 * so voice/style still apply.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const seed = typeof body.content === "string" ? body.content.trim() : "";
  if (!seed) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const { db } = await import("@/lib/db");

  const post = await db.post.findFirst({
    where: { id, teamId: s.teamId },
    include: {
      sourceVariant: {
        include: {
          generation: {
            select: { topicId: true, narrativeStyleId: true, prompt: true },
          },
        },
      },
    },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const gen = post.sourceVariant?.generation ?? null;

  const [styleProfile, samples, topic, narrative, fallbackTopic, fallbackNarrative] =
    await Promise.all([
      db.styleProfile.findUnique({ where: { teamId: s.teamId } }),
      db.samplePost.findMany({
        where: { teamId: s.teamId },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      gen?.topicId
        ? db.contentTopic.findFirst({
            where: { id: gen.topicId, teamId: s.teamId },
          })
        : Promise.resolve(null),
      gen?.narrativeStyleId
        ? db.narrativeStyle.findFirst({
            where: { id: gen.narrativeStyleId, teamId: s.teamId },
          })
        : Promise.resolve(null),
      gen?.topicId
        ? Promise.resolve(null)
        : db.contentTopic.findFirst({
            where: { teamId: s.teamId, isActive: true },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          }),
      gen?.narrativeStyleId
        ? Promise.resolve(null)
        : db.narrativeStyle.findFirst({
            where: { teamId: s.teamId, isActive: true },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          }),
    ]);

  const systemPrompt = buildSystemPrompt({
    styleProfile,
    samples,
    topic: topic ?? fallbackTopic ?? null,
    narrative: narrative ?? fallbackNarrative ?? null,
  });

  const userPrompt = buildGeneratePrompt({
    prompt: seed,
    context:
      "أعد صياغة الفكرة التالية كبوست LinkedIn جديد. النص الحالي هو نقطة انطلاق — احتفظ بالفكرة الجوهرية والحقائق، وأعد تشكيل الأسلوب والإيقاع وفق قواعد الصوت.",
    variantCount: 1,
  });

  const model = getGenerateModel();

  let raw: string;
  try {
    raw = await runClaude({
      systemPrompt,
      userPrompt,
      model,
      maxTokens: 3000,
      temperature: 0.85,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Regeneration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const parsed = parseVariants(raw);
  const variant = parsed[0];
  if (!variant) {
    return NextResponse.json(
      { error: "Model returned no content", raw },
      { status: 502 }
    );
  }

  return NextResponse.json({
    content: variant.content,
    hook: variant.hook,
    hashtags: variant.hashtags,
  });
}
