import type { StyleProfile, SamplePost, ContentTopic } from "@prisma/client";
import { BASE_VOICE } from "./base-voice";

function safeJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function buildSystemPrompt(opts: {
  styleProfile?: StyleProfile | null;
  samples?: SamplePost[];
  topic?: ContentTopic | null;
}): string {
  const parts: string[] = [BASE_VOICE];

  if (opts.styleProfile) {
    const pillars = safeJsonArray(opts.styleProfile.voicePillars);
    const doList = safeJsonArray(opts.styleProfile.doList);
    const dontList = safeJsonArray(opts.styleProfile.dontList);
    parts.push(
      `
---

**الأسلوب الشخصي للكاتب (مستخرج من بوستاته السابقة):**

نبرة عامة: ${opts.styleProfile.toneSummary}

أعمدة الصوت:
${pillars.map((p) => `- ${p}`).join("\n")}

ملاحظات على المفردات:
${opts.styleProfile.vocabularyNotes}

ملاحظات على البنية:
${opts.styleProfile.structureNotes}

افعل (Do):
${doList.map((p) => `- ${p}`).join("\n")}

لا تفعل (Don't):
${dontList.map((p) => `- ${p}`).join("\n")}
`.trim()
    );
  }

  if (opts.samples && opts.samples.length > 0) {
    const examples = opts.samples
      .slice(0, 4)
      .map((s, i) => `### مثال ${i + 1}\n${s.content}`)
      .join("\n\n---\n\n");
    parts.push(
      `
---

**أمثلة من بوستات الكاتب الفعلية (للاسترشاد بالأسلوب — لا تنسخ منها):**

${examples}
`.trim()
    );
  }

  if (opts.topic) {
    const frameworks = safeJsonArray(opts.topic.frameworks);
    const hashtags = safeJsonArray(opts.topic.hashtags);
    parts.push(
      `
---

**المحور المستهدف:** ${opts.topic.title}

${opts.topic.description}

**Frameworks ذات صلة:** ${frameworks.join(" · ")}

**Hashtags المقترحة:** ${hashtags.join(" ")}
`.trim()
    );
  }

  return parts.join("\n\n");
}

export function buildGeneratePrompt(opts: {
  prompt: string;
  context?: string;
  variantCount: number;
}): string {
  return `
اكتب لي ${opts.variantCount} نسخ مختلفة من بوست LinkedIn، حول الموضوع/الفكرة التالية:

**الفكرة:** ${opts.prompt}
${opts.context ? `\n**سياق إضافي:** ${opts.context}` : ""}

**متطلبات:**
- كل نسخة لها زاوية (angle) مختلفة عن الباقية — مش مجرد إعادة صياغة
- التزم بالبنية والصوت المحدد في system prompt
- اكتب البوست كاملاً جاهز للنشر، بدون مقدمات منك
- في النهاية، حدد الـ hashtags في سطر منفصل يبدأ بـ #
- لا تستخدم العنوان "نسخة 1"، "نسخة 2" — افصل بين النسخ بالسطر التالي فقط على سطر منفصل:

===VARIANT===

ابدأ:
`.trim();
}

export const ANALYZE_STYLE_PROMPT = `
أنت محلل أسلوب كتابي محترف. سأعطيك مجموعة بوستات كتبها شخص واحد على LinkedIn.

مهمتك: استخرج الأسلوب الشخصي للكاتب بدقة حتى نتمكن من توليد بوستات جديدة بنفس النبرة.

ارجع لي JSON صالح بالمفاتيح التالية بالضبط (وبدون أي نص خارج الـ JSON):

{
  "toneSummary": "وصف نبرة عامة في 2-3 جمل بالعربي",
  "voicePillars": ["أعمدة الصوت — 3 إلى 5 نقاط قصيرة"],
  "vocabularyNotes": "ملاحظات عن المفردات والمصطلحات المستخدمة (هل يخلط عربي/إنجليزي، نسبة الفصحى/العامية، استخدام emojis، استخدام hashtags، إلخ)",
  "structureNotes": "ملاحظات عن بنية البوست المعتاد (طول الفقرات، استخدام النقاط، CTA في النهاية، إلخ)",
  "doList": ["5-7 نقاط: أشياء يجب الالتزام بها لتقليد الأسلوب"],
  "dontList": ["3-5 نقاط: أشياء يجب تجنبها"],
  "rawAnalysis": "تحليل حر مفصّل (نص عربي) — بأي طول"
}

البوستات:

`.trim();
