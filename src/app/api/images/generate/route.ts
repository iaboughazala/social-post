import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import crypto from "node:crypto";
import { getVoiceSession } from "@/lib/voice/session";
import { runClaude, getGenerateModel } from "@/lib/voice/generate";
import { renderBrandSvg } from "@/lib/images/brand-template";
import { MEDIA_DIR, ensureMediaDir, mediaUrl } from "@/lib/images/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Stateless image generator — takes raw content in the body and returns a
 * URL. Used by /compose where no Post row exists yet. The per-post variant
 * at /api/posts/[id]/generate-image handles the "generate + attach"
 * pattern for existing posts.
 */
export async function POST(req: NextRequest) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const { db } = await import("@/lib/db");
  const user = await db.user.findUnique({
    where: { id: s.userId },
    select: { name: true },
  });
  const displayName =
    (typeof body.displayName === "string" && body.displayName.trim()) ||
    user?.name ||
    "Islam AbouGhazala";

  const system = `أنت مصمم محتوى بصري. مهمتك: استخراج عنوان قصير جداً للصورة الترويجية.

أعطني JSON صالح (فقط JSON، بدون شرح) بالشكل:
{
  "headline": "عنوان عربي في 4-7 كلمات فقط، بدون علامات ترقيم في النهاية، بدون هاشتاجات",
  "subtitle": "English subtitle, 2-3 words maximum, Title Case"
}

قواعد صارمة:
- headline لازم يكون عربي فصيح مباشر يلخّص الفكرة الجوهرية
- subtitle يكون المفهوم/الأداة/الإطار المركزي بالإنجليزي (مثال: "AI Strategy" / "Change Management")
- لا تستخدم أي علامات markdown
- لا تكرر كلمات في الاثنين`;

  const user_prompt = `النص:\n\n${content.slice(0, 1500)}\n\nJSON:`;

  let headline = "";
  let subtitle = "";
  try {
    const raw = await runClaude({
      systemPrompt: system,
      userPrompt: user_prompt,
      model: getGenerateModel(),
      maxTokens: 300,
      temperature: 0.3,
    });
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no JSON");
    const parsed = JSON.parse(match[0]) as { headline?: string; subtitle?: string };
    headline = (parsed.headline || "").trim().replace(/[.!؟?]+$/, "");
    subtitle = (parsed.subtitle || "").trim().replace(/[.!؟?]+$/, "");
    if (!headline) throw new Error("empty headline");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "extraction failed";
    return NextResponse.json(
      { error: `Failed to extract title: ${msg}` },
      { status: 500 }
    );
  }

  const svg = renderBrandSvg({ headline, subtitle, displayName });

  const sharp = (await import("sharp")).default;
  await ensureMediaDir();
  const filename = `gen-cmp-${crypto.randomBytes(8).toString("hex")}.png`;
  await sharp(Buffer.from(svg))
    .png({ quality: 90 })
    .toFile(path.join(MEDIA_DIR, filename));

  return NextResponse.json({
    url: mediaUrl(filename),
    headline,
    subtitle,
  });
}
