import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getVoiceSession } from "@/lib/voice/session";
import { runClaude, getGenerateModel } from "@/lib/voice/generate";
import { renderBrandSvg } from "@/lib/images/brand-template";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OUTPUT_DIR = path.join(process.cwd(), "public", "generated");

interface Extracted {
  headline: string;
  subtitle: string;
}

async function extractTitles(content: string): Promise<Extracted> {
  const system = `أنت مصمم محتوى بصري. مهمتك: استخراج عنوان قصير جداً للصورة الترويجية.

أعطني JSON صالح (فقط JSON، بدون شرح) بالشكل:
{
  "headline": "عنوان عربي في 4-7 كلمات فقط، بدون علامات ترقيم في النهاية، بدون هاشتاجات",
  "subtitle": "English subtitle, 2-3 words maximum, Title Case"
}

قواعد صارمة:
- headline لازم يكون عربي فصيح مباشر يلخّص الفكرة الجوهرية
- subtitle يكون المفهوم/الأداة/الإطار المركزي بالإنجليزي (مثال: "AI Strategy" / "Change Management" / "ROI Analysis")
- لا تستخدم أي علامات markdown أو ***
- لا تكرر كلمات في الاثنين`;

  const user = `النص:\n\n${content.slice(0, 1500)}\n\nJSON:`;

  const raw = await runClaude({
    systemPrompt: system,
    userPrompt: user,
    model: getGenerateModel(),
    maxTokens: 300,
    temperature: 0.3,
  });

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no JSON in response");
  const parsed = JSON.parse(match[0]) as Partial<Extracted>;

  const headline = (parsed.headline || "").trim().replace(/[.!؟?]+$/, "");
  const subtitle = (parsed.subtitle || "").trim().replace(/[.!؟?]+$/, "");
  if (!headline) throw new Error("empty headline");

  return { headline, subtitle };
}

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { db } = await import("@/lib/db");
  const post = await db.post.findFirst({
    where: { id, teamId: s.teamId },
    include: { author: { select: { name: true } } },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!post.content?.trim()) {
    return NextResponse.json(
      { error: "Post has no content to summarize" },
      { status: 400 }
    );
  }

  let extracted: Extracted;
  try {
    extracted = await extractTitles(post.content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "extraction failed";
    return NextResponse.json(
      { error: `Failed to extract title: ${msg}` },
      { status: 500 }
    );
  }

  const displayName = post.author?.name || "Islam AbouGhazala";
  const svg = renderBrandSvg({
    headline: extracted.headline,
    subtitle: extracted.subtitle,
    displayName,
  });

  const sharp = (await import("sharp")).default;
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const filename = `post-${post.id}-${Date.now()}.png`;
  const outPath = path.join(OUTPUT_DIR, filename);
  await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(outPath);

  const publicUrl = `/generated/${filename}`;

  // Attach to the post — replace any existing generated images (they start
  // with /generated/post-<id>-), keep user-uploaded media untouched.
  const existing: string[] = post.mediaUrls
    ? (JSON.parse(post.mediaUrls) as string[])
    : [];
  const kept = existing.filter(
    (u) => !u.startsWith(`/generated/post-${post.id}-`)
  );
  const nextUrls = [publicUrl, ...kept];
  await db.post.update({
    where: { id: post.id },
    data: { mediaUrls: JSON.stringify(nextUrls) },
  });

  return NextResponse.json({
    url: publicUrl,
    headline: extracted.headline,
    subtitle: extracted.subtitle,
  });
}
