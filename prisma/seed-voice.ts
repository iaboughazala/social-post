/**
 * Voice engine seed — Islam Abu-Ghazala's 4 topics + 4 sample posts.
 *
 * Usage:
 *   npx tsx prisma/seed-voice.ts --userId <uid> --teamId <tid>
 *   npx tsx prisma/seed-voice.ts --email <e@x> --teamId <tid>
 *
 * If teamId is omitted, uses the first team the user belongs to.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const TOPICS = [
  {
    slug: "business-excellence",
    order: 1,
    title: "التميّز المؤسسي (Business Excellence)",
    description:
      "بناء أنظمة إدارة متكاملة بتخلي المؤسسة تحقق نتائج مستدامة عبر الـ stakeholders كلهم — مش بس الربح.",
    frameworks: [
      "EFQM Model 2025",
      "Baldrige Excellence Framework",
      "ISO 9001 / ISO 9004",
      "King Abdulaziz Quality Award (KAQA)",
      "Dubai Quality Award",
      "Sheikh Khalifa Excellence Award",
    ],
    angles: [
      "ليه شركات المنطقة بتطبق EFQM شكلياً وبتفشل في الـ self-assessment الحقيقي",
      "تفكيك معيار من معايير الـ Baldrige وتطبيقه على شركة محلية",
      "الفرق بين الشركة اللي عندها ISO certificate والشركة اللي عندها Quality Culture",
      "Excellence مش مشروع، Excellence نظام تشغيل",
      "خرائط نضج (Maturity Models) من تجربة فعلية",
    ],
    hooks: [
      "مشروع self-assessment طبقته على شركة بمعيار EFQM",
      "شركة كانت حاصلة على جايزة وبعدها خسرتها — الأسباب",
      "الفرق بين قيادة بتؤمن بالـ Excellence وقيادة بتشتريها كـ branding",
    ],
    hashtags: [
      "#BusinessExcellence",
      "#EFQM",
      "#Baldrige",
      "#QualityManagement",
      "#ISO9001",
      "#MENA",
      "#GCC",
    ],
  },
  {
    slug: "operational-excellence",
    order: 2,
    title: "التميّز التشغيلي (Operational Excellence)",
    description:
      "تحويل العمليات اليومية لمصدر ميزة تنافسية من خلال التحسين المستمر، تقليل الهدر، ورفع الكفاءة.",
    frameworks: [
      "Lean Management",
      "Six Sigma / Lean Six Sigma",
      "Theory of Constraints (TOC)",
      "Kaizen & Gemba Walks",
      "TPM",
      "TQM",
      "Hoshin Kanri",
      "OKRs",
    ],
    angles: [
      "ليه Lean بتنجح في اليابان وبتفشل في مصانعنا — تحليل ثقافي وإداري",
      "Value Stream Mapping عملي على عملية في شركة محلية",
      "الفرق بين Cost Cutting و Cost Optimization",
      "الـ KPIs اللي بتقيس الحركة، مش الإنتاجية",
      "Bottleneck analysis بـ TOC في خط إنتاج/خدمة",
      "Standard Work — ليه شركاتنا بتقاومه",
    ],
    hooks: [
      "مشروع تطبيق Lean في مصنع/مكتب وإيه اللي اتعلمته",
      "Six Sigma project أنقذ/فشل وليه",
      "Gemba walk كشف مشاكل ما كانتش ظاهرة في التقارير",
    ],
    hashtags: [
      "#OperationalExcellence",
      "#Lean",
      "#SixSigma",
      "#Kaizen",
      "#ContinuousImprovement",
      "#MENA",
    ],
  },
  {
    slug: "digitalization",
    order: 3,
    title: "الرقمنة (Digitalization)",
    description:
      "استخدام التكنولوجيا لتحويل العمليات من ورقي/تقليدي لرقمي، بشكل بيخلق قيمة فعلية مش بس automation سطحي.",
    frameworks: [
      "Industry 4.0 / Smart Manufacturing",
      "Digital Maturity Models (Deloitte, MIT, Gartner)",
      "TOGAF",
      "ISO/IEC 38500",
      "Vision 2030 / UAE Digital Strategy",
      "RPA, IoT, AI/ML, Cloud, Data Analytics",
    ],
    angles: [
      "Digitalization مش Digitization — تفكيك الفرق بمثال",
      "ليه ERP implementations بتفشل في المنطقة (الأسباب الحقيقية)",
      "Maturity assessment عملي لشركة قبل الرقمنة",
      "الرقمنة بدون إعادة هندسة العمليات = أتمتة الفوضى",
      "Quick wins vs strategic investments",
      "Data Governance قبل Data Analytics",
      "AI في العمليات — استخدامات حقيقية مش hype",
    ],
    hooks: [
      "مشروع رقمنة نجح وآخر فشل — السبب الجذري",
      "شركة صرفت ملايين على ERP والمشكلة كانت في الـ processes",
      "Automation وفرت ساعات/تكلفة فعلاً — بالأرقام",
    ],
    hashtags: [
      "#Digitalization",
      "#Industry40",
      "#DigitalTransformation",
      "#ERP",
      "#Vision2030",
      "#SmartManufacturing",
    ],
  },
  {
    slug: "transformation",
    order: 4,
    title: "التحوّل المؤسسي (Transformation)",
    description:
      "قيادة التغيير الجذري في المؤسسات — استراتيجياً وثقافياً وتشغيلياً — بحيث يكون مستدام مش موجة.",
    frameworks: [
      "Kotter's 8-Step Change Model",
      "ADKAR Model (Prosci)",
      "McKinsey 7-S",
      "Lewin's Change Management",
      "Bridges' Transition Model",
      "Agile Transformation (SAFe, LeSS)",
      "Business Model Canvas",
      "Blue Ocean Strategy",
    ],
    angles: [
      "ليه 70% من مشاريع التحوّل بتفشل — الأسباب الحقيقية في سياقنا",
      "Strategy ≠ Transformation — الفرق بمثال",
      "Cultural transformation — أصعب جزء وأهم جزء",
      "Change fatigue في المؤسسات — إزاي تتعامل معاها",
      "Top-down vs Bottom-up vs Hybrid transformation",
      "KPIs of transformation — مش بس النتائج المالية",
      "دور القيادة في التحوّل — مش delegation",
    ],
    hooks: [
      "مشروع تحوّل قُدته/شاركت فيه — الدروس الكبيرة",
      "مقاومة التغيير — حالات حقيقية وكيف تُعالج",
      "شركة عملت تحوّل ناجح في ظروف صعبة",
    ],
    hashtags: [
      "#Transformation",
      "#ChangeManagement",
      "#Leadership",
      "#Strategy",
      "#OrganizationalDevelopment",
      "#MENA",
    ],
  },
];

const SAMPLE_POSTS: { content: string; notes: string }[] = [
  {
    content: `إيرادات مزيفة؟ .. أم أصول مالية؟

كثير من الشركات تسجل الإيرادات غير المفوترة ضمن أرباح العام الحالي، رغم أن الفوترة الفعلية قد تتم في العام التالي.
هناك طريقتان لتسجيل الإيرادات:
أولا: مبدأ الاستحقاق: يتم تسجيل الإيراد عند إكمال العمل، حتى لو لم تصدر الفاتورة بعد.
ثانيا: مبدأ الأساس النقدي: يتم تسجيل الإيراد عند استلام الدفعة، أي في فترة إصدار الفاتورة فعليا.
أين تكمن المشكلة؟
الشركات الخدمية بطبيعتها تواجه متغيرات تشغيلية وحكومية مستمرة، مما يجعل الاعتماد على مبدأ الاستحقاق محفوفًا بالمخاطر.

💡 الحل؟
أرى أن يتم احتساب الإيرادات غير المفوترة (Unbilled Revenue) كإيراد مرحّل من العام السابق، بناءً على تاريخ الفوترة وليس تاريخ تنفيذ العمل.

🔍 السؤال الأهم: هل تحتسب شركتك إيرادات غير مفوترة؟ وهل تعتقد أنها تعكس الواقع المالي بدقة؟

#Unbilled_Revenue #Finance #Cash_Flow`,
    notes: "بوست عن الإيرادات المزيفة والـ Cash Flow",
  },
  {
    content: `العمليات وتأثيرها على الشركات..
في إحدى الشركات، اذا طلب الموظف إصدار فاتورة يواجه تأخر مستمر؛ بعد يومين من الطلب، يأتيه رد من المالية يطلب وثيقة أو معلومة إضافية. وهكذا دواليك.. عدة طلبات متفرقة خلال فترة متقطعة لاتمام المهمة الواحدة (انشاء فاتورة)!

هذا التأخير كان يؤثر على سرعة #التحصيل، و ينعكس بشكل مباشر على التدفق #النقدي (#Cash_Flow) للشركة.

لذلك تصبح أهمية #العمليات كعمود فقري لـ #الحوكمة:
✅ تقليل التكاليف
✅ تحسين العائد على الاستثمار (ROI)
✅ توفير الوقت
✅ تعزيز اتخاذ القرار
✅ النمو المستدام
✅ زيادة الكفاءة

كيف تنشئ العمليات داخل الشركة؟
🚀 #Gap_Analysis لتحديد الفجوات بين الوضع الحالي والمطلوب
🚀 رسم العمليات باستخدام أدوات مثل خرائط التدفق (Flowcharts)
🚀 إنشاء دليل إرشادي يوضح الاجراءات (#Procedures)
🚀 تدريب الموظفين و تجربة العمليات على نطاق صغير
🚀 جمع ملاحظات الموظفين والعملاء لتحسين العمليات

💬 هل تواجه تحديات في هذا الجانب؟`,
    notes: "بوست عن العمليات والحوكمة",
  },
  {
    content: `لماذا تحتاج شركتك أن تبدأ العام الجديد بـ Revenue Forecast؟

التخطيط المالي العمود الفقري لضمان استدامة أي شركة. ومع بداية العام الجديد، يصبح إعداد Revenue Forecast خطوة أساسية لتحقيق أهدافها المالية والعملية.

بدون Revenue Forecast، تصبح الشركة بلا رؤية واضحة، وتعمل بشكل عشوائي يؤدي إلى تخبط وفقدان الفرص.

ما أهمية إعداد Revenue Forecast؟
- رؤية واضحة للإيرادات المتوقعة
- اتخاذ قرارات مبنية على البيانات
- إدارة فعالة للتدفقات النقدية
- تعزيز الثقة لدى الفريق والشركاء

خطوات إعداد Revenue Forecast فعّال:
أولا: تحديد المصادر الرئيسية للإيرادات (Existing Clients, New Business, Upselling)
ثانيا: تقسيم التوقعات على فترات زمنية شهرية
ثالثا: إشراك فريق العمل
رابعا: المتابعة المستمرة

لدي نموذج جاهز ومُبسط لـ #Revenue_Forecast. للحصول على النموذج، عرفني وسأرسله لك!`,
    notes: "بوست عن Revenue Forecast",
  },
  {
    content: `إدارة الموارد .. السهل الممتنع | Resources Allocation

إدارة الموارد و توزيع المهام والموظفين على المشاريع واحدة من أكثر الأشياء تعقيدا داخل الشركات. لاختلاف طبيعة كل مشروع وشركة مع ندرة الكفاءات وطول عملية التوظيف.

لماذا تبدو إدارة الموارد معقدة؟
- نقص الكفاءات المناسبة
- غياب التخطيط المستقبلي
- تأثير الضغط الزمني
- عدم وضوح الأدوار والمسؤوليات
- نقص الأدوات التقنية

هنا أقترح ثلاثة حلول:
أولا: وضع آلية للتعيينات (عمليات واجراءات)
ثانيا: استخدام اداة تقنية لتحليل الموارد والاحتياجات
ثالثا: الاستعانة بالموارد الخارجية (شركات التوظيف، الفريلانسر)

سيظل هناك تخبط واضح اذا لم يتم الاتفاق داخليا على الية لتحديد احتياجات الموظفين من المشاريع.

وأنت، ازاي تدير شركتك مواردها؟ شاركنا تجربتك! 😊`,
    notes: "بوست عن Resource Allocation",
  },
];

function parseArgs(): { userId?: string; email?: string; teamId?: string } {
  const args = process.argv.slice(2);
  const out: { userId?: string; email?: string; teamId?: string } = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--userId") out.userId = args[++i];
    else if (a === "--email") out.email = args[++i];
    else if (a === "--teamId") out.teamId = args[++i];
  }
  return out;
}

async function main() {
  const { userId: argUserId, email, teamId: argTeamId } = parseArgs();

  let userId = argUserId;
  if (!userId && email) {
    const u = await db.user.findUnique({ where: { email } });
    if (!u) throw new Error(`User with email ${email} not found`);
    userId = u.id;
  }
  if (!userId) {
    throw new Error("Provide --userId <id> or --email <email>");
  }

  let teamId = argTeamId;
  if (!teamId) {
    const tm = await db.teamMember.findFirst({
      where: { userId },
      orderBy: { team: { createdAt: "asc" } },
    });
    if (!tm) throw new Error(`No team found for user ${userId}. Pass --teamId.`);
    teamId = tm.teamId;
  }

  console.log(`🌱 Seeding voice engine for userId=${userId}, teamId=${teamId}`);

  // Topics — team-scoped, upsert by (teamId, slug)
  for (const t of TOPICS) {
    await db.contentTopic.upsert({
      where: { teamId_slug: { teamId, slug: t.slug } },
      update: {
        title: t.title,
        description: t.description,
        frameworks: JSON.stringify(t.frameworks),
        angles: JSON.stringify(t.angles),
        hooks: JSON.stringify(t.hooks),
        hashtags: JSON.stringify(t.hashtags),
        order: t.order,
        isActive: true,
      },
      create: {
        teamId,
        slug: t.slug,
        title: t.title,
        description: t.description,
        frameworks: JSON.stringify(t.frameworks),
        angles: JSON.stringify(t.angles),
        hooks: JSON.stringify(t.hooks),
        hashtags: JSON.stringify(t.hashtags),
        order: t.order,
      },
    });
  }
  console.log(`  ✓ ${TOPICS.length} topics (team ${teamId})`);

  // Sample posts — team-scoped, skip if team already has any
  const existingCount = await db.samplePost.count({ where: { teamId } });
  if (existingCount === 0) {
    for (const p of SAMPLE_POSTS) {
      await db.samplePost.create({
        data: { teamId, content: p.content, notes: p.notes },
      });
    }
    console.log(`  ✓ ${SAMPLE_POSTS.length} sample posts (team ${teamId})`);
  } else {
    console.log(`  → ${existingCount} sample posts already exist (skipped)`);
  }

  console.log("✅ Done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
