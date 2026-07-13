import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";
import { buildSystemPrompt, buildGeneratePrompt } from "@/lib/voice/prompts";
import { runClaude, getGenerateModel } from "@/lib/voice/generate";
import { parseVariants } from "@/lib/voice/parse";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_TOTAL = 20;
const CONCURRENCY = 3;

interface BatchItem {
  topicId: string | null;
  prompt: string;
}

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function safeArr(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const requestedCountPerTopic = Math.max(
    1,
    Math.min(10, Math.floor(Number(body.countPerTopic) || 3))
  );
  const specificTopicIds: string[] | undefined = Array.isArray(body.topicIds)
    ? body.topicIds.map(String)
    : undefined;

  const { db } = await import("@/lib/db");

  const topics = await db.contentTopic.findMany({
    where: {
      teamId: s.teamId,
      isActive: true,
      ...(specificTopicIds && specificTopicIds.length > 0
        ? { id: { in: specificTopicIds } }
        : {}),
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  if (topics.length === 0) {
    return NextResponse.json(
      { error: "No active topics found" },
      { status: 400 }
    );
  }

  // Build the list of items to generate
  const items: BatchItem[] = [];
  for (const topic of topics) {
    const angles = safeArr(topic.angles);
    const hooks = safeArr(topic.hooks);
    for (let i = 0; i < requestedCountPerTopic; i++) {
      const angle = pickRandom(angles) || pickRandom(hooks) || topic.description;
      items.push({ topicId: topic.id, prompt: angle });
    }
  }

  if (items.length > MAX_TOTAL) {
    items.length = MAX_TOTAL;
  }

  const userId = s.userId;
  const teamId = s.teamId;
  const [styleProfile, samples] = await Promise.all([
    db.styleProfile.findUnique({ where: { userId } }),
    db.samplePost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const model = getGenerateModel();
  const topicsById = new Map(topics.map((t) => [t.id, t]));

  const created: Array<{ postId: string; topicId: string | null; prompt: string }> =
    [];
  const failures: Array<{ prompt: string; error: string }> = [];

  // Simple concurrency pool
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const idx = cursor++;
      const item = items[idx];
      const topic = item.topicId ? topicsById.get(item.topicId) : null;
      const systemPrompt = buildSystemPrompt({
        styleProfile,
        samples,
        topic: topic ?? null,
      });
      const userPrompt = buildGeneratePrompt({
        prompt: item.prompt,
        variantCount: 1,
      });

      try {
        const raw = await runClaude({
          systemPrompt,
          userPrompt,
          model,
          maxTokens: 3000,
          temperature: 0.85,
        });
        const parsed = parseVariants(raw);
        const variant = parsed[0];
        if (!variant) throw new Error("no variant parsed");

        const generation = await db.generation.create({
          data: {
            userId,
            teamId,
            topicId: topic?.id ?? null,
            prompt: item.prompt,
            variantCount: 1,
            rawResponse: raw,
            model,
            variants: {
              create: [
                {
                  variantIndex: 0,
                  content: variant.content,
                  hook: variant.hook,
                  hashtags: JSON.stringify(variant.hashtags),
                },
              ],
            },
          },
          include: { variants: true },
        });

        const post = await db.post.create({
          data: {
            content: variant.content,
            status: "draft",
            teamId,
            authorId: userId,
          },
        });
        await db.postVariant.update({
          where: { id: generation.variants[0].id },
          data: { postId: post.id },
        });

        created.push({ postId: post.id, topicId: topic?.id ?? null, prompt: item.prompt });
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown";
        console.error(
          `[voice/batch] item ${idx} failed (topic=${topic?.slug ?? "none"}, prompt="${item.prompt.slice(0, 80)}"): ${message}`
        );
        failures.push({ prompt: item.prompt, error: message });
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, () =>
    worker()
  );
  await Promise.all(workers);

  return NextResponse.json({
    requested: items.length,
    created: created.length,
    failed: failures.length,
    posts: created,
    failures,
  });
}
