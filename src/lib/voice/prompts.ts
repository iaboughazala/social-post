import type {
  StyleProfile,
  SamplePost,
  ContentTopic,
  NarrativeStyle,
} from "@prisma/client";
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
  narrative?: NarrativeStyle | null;
}): string {
  const parts: string[] = [BASE_VOICE];

  // User-authored writing rules take precedence over everything else —
  // they represent explicit decisions from the human reviewer after
  // looking at generated output. Put them RIGHT AFTER the base voice
  // (before the auto-extracted style) so the model reads them first.
  const custom = opts.styleProfile?.customInstructions?.trim();
  if (custom) {
    parts.push(
      `
---

**قواعد الكتابة الصارمة (من الكاتب — التزم بها حرفياً، وأي تعارض بينها وبين ما يلي يُحسم لصالحها):**

${custom}
`.trim()
    );
  }

  if (opts.styleProfile) {
    const pillars = safeJsonArray(opts.styleProfile.voicePillars);
    const doList = safeJsonArray(opts.styleProfile.doList);
    const dontList = safeJsonArray(opts.styleProfile.dontList);
    parts.push(
      `
---

**الصوت الشخصي للكاتب (Voice — مستخرج من بوستاته السابقة):**

هذا القسم يصف **نبرة الكاتب ومفرداته وإيقاعه** فقط. البنية الهيكلية (افتتاحيات/خواتم/انتقالات/عدد أسئلة) لا تُستخرج من هنا — هي مسؤولية الأسلوب السردي (Narrative Style) الحالي، ولا تعتبرها بصمة الكاتب حتى لو تكررت في العينات.

نبرة عامة: ${opts.styleProfile.toneSummary}

أعمدة الصوت:
${pillars.map((p) => `- ${p}`).join("\n")}

ملاحظات على المفردات:
${opts.styleProfile.vocabularyNotes}

إيقاع الجمل والفقرات:
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

**المحور المستهدف (Content Topic — ماذا نتحدث):** ${opts.topic.title}

${opts.topic.description}

**Frameworks ذات صلة:** ${frameworks.join(" · ")}

**Hashtags المقترحة:** ${hashtags.join(" ")}
`.trim()
    );
  }

  if (opts.narrative) {
    parts.push(
      `
---

**الأسلوب السردي (Narrative Style — كيف نحكي):** ${opts.narrative.name}

${opts.narrative.description}

التزم بهذا الشكل السردي. لا تخلط بين أساليب سردية مختلفة في نفس البوست.
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

**مهمتك: استخرج الصوت الشخصي (Personal Voice) فقط — لا تستخرج البنية الهيكلية (Structure).**

الفرق بين الاثنين — والالتزام به إلزامي:

**الصوت (Voice) — استخرجه:**
- النبرة العامة (Tone) ودرجة الرسمية
- المفردات والمصطلحات المميزة
- درجة خلط العربي بالإنجليزي، لهجة الكاتب
- إيقاع الجملة (طويلة/قصيرة، بسيطة/مركّبة)
- طول الفقرات النمطي (بغض النظر عن ترتيبها)
- طريقته في شرح فكرة معقدة
- استخدام emojis / hashtags كمَيل عام (لا كقالب)
- الأسلوب في السرد (شخصي/تنفيذي/تحليلي)

**البنية (Structure) — تجاهلها تماماً، حتى لو تكررت:**
- الافتتاحيات المحددة ("بيتقال إن..."، "في يوم من الأيام...")
- الخواتم المتكررة ("من وجهة نظري..."، "وأنت... ما رأيك؟")
- الانتقالات المتكررة ("المشكلة ليست..."، "بل..."، "لذلك...")
- عدد الأسئلة في النهاية
- ترتيب الفقرات (Hook → Story → Insight → CTA)
- موقع القصة في البوست
- استخدام النقاط المرقمة كقالب

إذا وجدت أن العينات كلها تنتهي بـ "من وجهة نظري..." أو كلها تفتتح بـ "بيتقال إن..."، **لا تعتبرها بصمة الكاتب** — اعتبرها صدفة أو تحيّز في اختيار العينة، وتجاهلها. البنية تجيء من الأسلوب السردي (Narrative Style) لكل بوست على حدة، مش من التاريخ.

قاعدة تلخيصية:
> الصوت يتطوّر مع الوقت ليصبح أقرب لأسلوب الكاتب. البنية تتنوّع مع الوقت عمداً لتجنب القوالب.

ارجع لي JSON صالح بالمفاتيح التالية بالضبط (وبدون أي نص خارج الـ JSON):

{
  "toneSummary": "وصف نبرة عامة في 2-3 جمل بالعربي (Voice فقط)",
  "voicePillars": ["أعمدة الصوت — 3 إلى 5 نقاط قصيرة عن Voice"],
  "vocabularyNotes": "المفردات، الخلط اللغوي، مستوى الفصحى/العامية، استخدام emojis/hashtags كميل عام",
  "structureNotes": "إيقاع الجمل والفقرات فقط: طول الجملة النموذجي، طول الفقرة، هل يمزج بين قصيرة وطويلة، هل يكسر الفقرات بجمل مفردة. **لا تكتب هنا افتتاحيات/خواتم/انتقالات/ترتيب فقرات**.",
  "doList": ["5-7 نقاط عن Voice — أشياء يجب الالتزام بها لتقليد نبرته"],
  "dontList": ["3-5 نقاط عن Voice — أشياء يجب تجنبها في نبرته"],
  "rawAnalysis": "تحليل حر مفصّل عن Voice فقط (نص عربي) — بأي طول"
}

البوستات:

`.trim();
