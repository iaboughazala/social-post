import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MOCK_CONTENT: Record<string, Record<string, string>> = {
  en: {
    professional:
      "We are excited to announce our latest innovation that transforms the way teams collaborate on social media. Our data-driven approach ensures maximum engagement and growth for your brand.",
    casual:
      "Hey everyone! Just wanted to share something cool we've been working on. It's going to make your social media life SO much easier. Stay tuned for the big reveal!",
    humorous:
      "Plot twist: managing social media doesn't have to feel like herding cats. We built something that actually makes it fun. Your future self will thank you!",
    inspirational:
      "Every great brand starts with a story worth sharing. Today, we're helping you tell yours to the world. Dream big, post consistently, and watch your community grow.",
  },
  ar: {
    professional:
      "يسعدنا الإعلان عن أحدث ابتكاراتنا التي تحول طريقة تعاون الفرق على وسائل التواصل الاجتماعي. نهجنا المبني على البيانات يضمن أقصى تفاعل ونمو لعلامتك التجارية.",
    casual:
      "مرحبا بالجميع! أردنا مشاركة شيء رائع كنا نعمل عليه. سيجعل حياتكم على وسائل التواصل الاجتماعي أسهل بكثير. ترقبوا المفاجأة!",
    humorous:
      "مفاجأة: إدارة وسائل التواصل الاجتماعي لا يجب أن تكون مهمة مستحيلة. بنينا شيئاً يجعلها ممتعة فعلاً. ستشكرون أنفسكم لاحقاً!",
    inspirational:
      "كل علامة تجارية عظيمة تبدأ بقصة تستحق المشاركة. اليوم، نساعدك في سرد قصتك للعالم. احلم كبيراً، انشر باستمرار، وشاهد مجتمعك ينمو.",
  },
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { topic, tone, platform, language } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const selectedTone = tone || "professional";
    const selectedLanguage = language || "en";
    const selectedPlatform = platform || "general";

    // If Anthropic API key is available, use Claude
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const client = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const platformGuidance =
          selectedPlatform === "twitter"
            ? "Keep it under 280 characters."
            : selectedPlatform === "linkedin"
            ? "Use a professional tone suitable for LinkedIn. Can be longer form."
            : selectedPlatform === "instagram"
            ? "Make it engaging and visual-friendly. Include relevant hashtag suggestions."
            : "Make it suitable for a general social media audience.";

        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: `Generate a social media post about the following topic.

Topic: ${topic}
Tone: ${selectedTone}
Platform: ${selectedPlatform}
Language: ${selectedLanguage === "ar" ? "Arabic" : "English"}

${platformGuidance}

Return only the post content, no explanations or metadata.`,
            },
          ],
        });

        const textBlock = message.content.find(
          (block: any) => block.type === "text"
        );
        const content = textBlock ? (textBlock as any).text : "";

        return NextResponse.json({ content });
      } catch (aiError) {
        console.error("AI generation failed, falling back to mock:", aiError);
        // Fall through to mock content
      }
    }

    // Fallback: return mock content based on tone and language
    const langContent =
      MOCK_CONTENT[selectedLanguage] || MOCK_CONTENT["en"];
    const content =
      langContent[selectedTone] || langContent["professional"];

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Failed to generate content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
