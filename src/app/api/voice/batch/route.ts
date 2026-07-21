import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";
import { buildSystemPrompt, buildGeneratePrompt } from "@/lib/voice/prompts";
import { runClaude, getGenerateModel } from "@/lib/voice/generate";
import { parseVariants } from "@/lib/voice/parse";
import type { ContentTopic, NarrativeStyle } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_TOTAL = 40;
const CONCURRENCY = 3;

interface BatchItem {
  topicId: string;
  narrativeId: string | null;
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

/**
 * Interleave items so no two consecutive picks share the same topic (never
 * more than 2× in a row for any topic — but this scheduler aims for the
 * stronger "never repeat back-to-back"). Round-robin by topic index into
 * a queue of per-topic slot counts.
 */
function interleaveByTopic(
  topics: ContentTopic[],
  perTopic: number
): Array<{ topic: ContentTopic; slot: number }> {
  const queues = topics.map((t) => ({ t, remaining: perTopic }));
  const out: Array<{ topic: ContentTopic; slot: number }> = [];
  let cursor = 0;
  let safety = topics.length * perTopic * 4;
  while (queues.some((q) => q.remaining > 0) && safety-- > 0) {
    const q = queues[cursor % queues.length];
    if (q.remaining > 0) {
      // Guard: never emit the same topic as the last one, if another topic
      // has capacity. Skip forward when we would.
      const lastTopicId = out.length ? out[out.length - 1].topic.id : null;
      if (q.t.id === lastTopicId && queues.some((x) => x !== q && x.remaining > 0)) {
        cursor++;
        continue;
      }
      out.push({ topic: q.t, slot: perTopic - q.remaining });
      q.remaining--;
    }
    cursor++;
  }
  return out;
}

/**
 * Assign a narrative to every batch item cycling through the active pool,
 * with a shuffle so a Batch run doesn't always start with the same style,
 * and a look-behind so we never assign the same narrative twice in a row.
 */
function cycleNarratives(
  narratives: NarrativeStyle[],
  count: number
): Array<NarrativeStyle | null> {
  if (narratives.length === 0) return Array(count).fill(null);
  // Fisher-Yates on a copy
  const pool = [...narratives];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const out: NarrativeStyle[] = [];
  let cursor = 0;
  while (out.length < count) {
    const next = pool[cursor % pool.length];
    const last = out[out.length - 1];
    if (last && last.id === next.id && pool.length > 1) {
      cursor++;
      continue;
    }
    out.push(next);
    cursor++;
  }
  return out;
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

  const [topics, narratives] = await Promise.all([
    db.contentTopic.findMany({
      where: {
        teamId: s.teamId,
        isActive: true,
        ...(specificTopicIds && specificTopicIds.length > 0
          ? { id: { in: specificTopicIds } }
          : {}),
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    db.narrativeStyle.findMany({
      where: { teamId: s.teamId, isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  if (topics.length === 0) {
    return NextResponse.json(
      { error: "No active topics found" },
      { status: 400 }
    );
  }

  // Interleave topic order so consecutive posts don't share a topic.
  const scheduled = interleaveByTopic(topics, requestedCountPerTopic);
  if (scheduled.length > MAX_TOTAL) scheduled.length = MAX_TOTAL;

  const narrativeAssignments = cycleNarratives(narratives, scheduled.length);

  // Build the final item list, matching a fresh prompt (random angle/hook)
  // to each (topic, narrative) pair.
  const items: BatchItem[] = scheduled.map(({ topic }, i) => {
    const angles = safeArr(topic.angles);
    const hooks = safeArr(topic.hooks);
    const angle = pickRandom(angles) || pickRandom(hooks) || topic.description;
    return {
      topicId: topic.id,
      narrativeId: narrativeAssignments[i]?.id ?? null,
      prompt: angle,
    };
  });

  const userId = s.userId;
  const teamId = s.teamId;
  const [styleProfile, samples] = await Promise.all([
    db.styleProfile.findUnique({ where: { teamId } }),
    db.samplePost.findMany({
      where: { teamId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const model = getGenerateModel();
  const topicsById = new Map(topics.map((t) => [t.id, t]));
  const narrativesById = new Map(narratives.map((n) => [n.id, n]));

  const created: Array<{
    postId: string;
    topicId: string | null;
    narrativeId: string | null;
    prompt: string;
  }> = [];
  const failures: Array<{ prompt: string; error: string }> = [];

  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const idx = cursor++;
      const item = items[idx];
      const topic = topicsById.get(item.topicId) ?? null;
      const narrative = item.narrativeId
        ? (narrativesById.get(item.narrativeId) ?? null)
        : null;

      const systemPrompt = buildSystemPrompt({
        styleProfile,
        samples,
        topic,
        narrative,
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
            narrativeStyleId: narrative?.id ?? null,
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

        created.push({
          postId: post.id,
          topicId: topic?.id ?? null,
          narrativeId: narrative?.id ?? null,
          prompt: item.prompt,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown";
        console.error(
          `[voice/batch] item ${idx} failed (topic=${topic?.slug ?? "none"}, narrative=${narrative?.slug ?? "none"}, prompt="${item.prompt.slice(0, 80)}"): ${message}`
        );
        failures.push({ prompt: item.prompt, error: message });
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, items.length) },
    () => worker()
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
