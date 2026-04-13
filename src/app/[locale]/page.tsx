import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Share2,
  Sparkles,
  BarChart3,
  Users,
  LayoutGrid,
  Check,
  ArrowRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: CalendarDays,
    titleKey: "scheduling",
    title: "Smart Scheduling",
    titleAr: "جدولة ذكية",
    description: "Schedule posts across all platforms with optimal timing suggestions.",
    descriptionAr: "جدولة المنشورات عبر جميع المنصات مع اقتراحات التوقيت المثالي.",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    icon: Share2,
    titleKey: "multiPlatform",
    title: "Multi-Platform",
    titleAr: "متعدد المنصات",
    description: "Publish to Facebook, Instagram, X, and LinkedIn from one dashboard.",
    descriptionAr: "انشر على فيسبوك وإنستغرام وإكس ولينكدإن من لوحة تحكم واحدة.",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  {
    icon: Sparkles,
    titleKey: "aiContent",
    title: "AI Content",
    titleAr: "محتوى بالذكاء الاصطناعي",
    description: "Generate engaging posts with AI tailored to your brand voice.",
    descriptionAr: "أنشئ منشورات جذابة بالذكاء الاصطناعي تناسب هوية علامتك.",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    icon: BarChart3,
    titleKey: "analytics",
    title: "Analytics",
    titleAr: "التحليلات",
    description: "Track performance with detailed analytics and actionable insights.",
    descriptionAr: "تتبع الأداء بتحليلات مفصلة ورؤى قابلة للتنفيذ.",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    icon: Users,
    titleKey: "teamCollab",
    title: "Team Collaboration",
    titleAr: "تعاون الفريق",
    description: "Invite team members, assign roles, and manage approval workflows.",
    descriptionAr: "ادعُ أعضاء الفريق وعيّن الأدوار وأدر سير عمل الموافقات.",
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    icon: LayoutGrid,
    titleKey: "calendarView",
    title: "Calendar View",
    titleAr: "عرض التقويم",
    description: "Visualize your content strategy with an intuitive calendar interface.",
    descriptionAr: "تصور استراتيجية المحتوى الخاصة بك بواجهة تقويم بديهية.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
  },
];

const PRICING_PLANS = [
  {
    name: "Free",
    nameAr: "مجانية",
    price: "$0",
    period: "/mo",
    periodAr: "/شهر",
    description: "Perfect for getting started",
    descriptionAr: "مثالية للبدء",
    features: [
      "3 social accounts",
      "10 scheduled posts/month",
      "Basic analytics",
      "1 user",
    ],
    featuresAr: [
      "3 حسابات اجتماعية",
      "10 منشورات مجدولة/شهر",
      "تحليلات أساسية",
      "مستخدم واحد",
    ],
    cta: "Get Started Free",
    ctaAr: "ابدأ مجانًا",
    popular: false,
  },
  {
    name: "Pro",
    nameAr: "احترافية",
    price: "$29",
    period: "/mo",
    periodAr: "/شهر",
    description: "For growing businesses",
    descriptionAr: "للأعمال النامية",
    features: [
      "10 social accounts",
      "Unlimited scheduled posts",
      "Advanced analytics",
      "5 team members",
      "AI content generation",
      "Priority support",
    ],
    featuresAr: [
      "10 حسابات اجتماعية",
      "منشورات مجدولة غير محدودة",
      "تحليلات متقدمة",
      "5 أعضاء فريق",
      "توليد محتوى بالذكاء الاصطناعي",
      "دعم ذو أولوية",
    ],
    cta: "Start Pro Trial",
    ctaAr: "ابدأ التجربة الاحترافية",
    popular: true,
  },
  {
    name: "Business",
    nameAr: "أعمال",
    price: "$79",
    period: "/mo",
    periodAr: "/شهر",
    description: "For large teams and agencies",
    descriptionAr: "للفرق الكبيرة والوكالات",
    features: [
      "Unlimited social accounts",
      "Unlimited scheduled posts",
      "Custom analytics & reports",
      "Unlimited team members",
      "AI content generation",
      "Approval workflows",
      "White-label option",
      "Dedicated account manager",
    ],
    featuresAr: [
      "حسابات اجتماعية غير محدودة",
      "منشورات مجدولة غير محدودة",
      "تحليلات وتقارير مخصصة",
      "أعضاء فريق غير محدودين",
      "توليد محتوى بالذكاء الاصطناعي",
      "سير عمل الموافقات",
      "خيار العلامة البيضاء",
      "مدير حساب مخصص",
    ],
    cta: "Contact Sales",
    ctaAr: "تواصل مع المبيعات",
    popular: false,
  },
];

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 text-center">
          <Badge variant="secondary" className="mb-6">
            <Zap className="size-3" />
            The future of social media management
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            {t("heroTitle")}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/en/register">
              <Button size="lg" className="text-base px-8 h-12">
                {t("cta")}
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="text-base px-8 h-12">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28 bg-muted/30" id="features">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              {t("features")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to succeed
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools to manage, create, and analyze your social media
              presence across all major platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.titleKey}
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="pt-6">
                    <div
                      className={cn(
                        "inline-flex items-center justify-center size-12 rounded-xl mb-4",
                        feature.bgColor
                      )}
                    >
                      <Icon className={cn("size-6", feature.color)} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 sm:py-28" id="pricing">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              {t("pricing")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {PRICING_PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col",
                  plan.popular &&
                    "ring-2 ring-primary shadow-lg shadow-primary/10 scale-[1.02]"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="shadow-sm">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="size-4 text-green-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/en/register" className="w-full">
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="size-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">SocialPost</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The all-in-one platform for social media management.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer transition-colors">
                  Features
                </li>
                <li className="hover:text-foreground cursor-pointer transition-colors">
                  Pricing
                </li>
                <li className="hover:text-foreground cursor-pointer transition-colors">
                  Integrations
                </li>
                <li className="hover:text-foreground cursor-pointer transition-colors">
                  Changelog
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer transition-colors">
                  About
                </li>
                <li className="hover:text-foreground cursor-pointer transition-colors">
                  Blog
                </li>
                <li className="hover:text-foreground cursor-pointer transition-colors">
                  Careers
                </li>
                <li className="hover:text-foreground cursor-pointer transition-colors">
                  Contact
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer transition-colors">
                  Privacy Policy
                </li>
                <li className="hover:text-foreground cursor-pointer transition-colors">
                  Terms of Service
                </li>
                <li className="hover:text-foreground cursor-pointer transition-colors">
                  Cookie Policy
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 SocialPost. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
