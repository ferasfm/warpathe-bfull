import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { Fuel, ShieldCheck, Radio, MapPin, Users, Target, Sparkles, Award, HeartHandshake, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — شركة الهدى للمحروقات" },
      { name: "description", content: "تعرّف على شركة الهدى للمحروقات، رؤيتنا ورسالتنا وقيمنا في توفير المحروقات لأهالي الضفة الغربية بجودة وموثوقية." },
      { property: "og:title", content: "من نحن — شركة الهدى للمحروقات" },
      { property: "og:description", content: "قصة شركة الهدى للمحروقات ورؤيتنا لخدمة الضفة الغربية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 80% 30%, oklch(0.55 0.22 27) 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary-foreground ring-1 ring-primary/40">
            <Sparkles className="h-3 w-3" /> من نحن
          </div>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">
            شركة الهدى <span className="text-primary">للمحروقات</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-secondary-foreground/80 sm:text-lg">
            شريكك الموثوق في توفير المحروقات عبر شبكة محطاتنا المنتشرة في الضفة الغربية،
            بخدمة سريعة وتحديث فوري لتوفر الوقود.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">قصتنا</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                انطلقت شركة الهدى للمحروقات من إيمانٍ عميق بأن الوقود شريان الحياة اليومية،
                وأن المواطن الفلسطيني يستحق خدمة موثوقة وشفافة تصله في الوقت والمكان المناسبين.
              </p>
              <p>
                على مدار سنوات، وسّعنا شبكة محطاتنا لتغطي مدن ومحافظات الضفة الغربية،
                وحرصنا على أن نكون الأقرب إلى العميل — ليس بالمسافة فحسب، بل بالجودة والثقة.
              </p>
              <p>
                اليوم، ومع إطلاق منصتنا الرقمية للتحديث الفوري، أصبح بإمكان كل مواطن معرفة
                توفر البنزين والسولار والغاز في أقرب محطة، قبل أن يغادر بيته.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<MapPin className="h-6 w-6" />} value="+15" label="محطة وقود" />
            <StatCard icon={<Users className="h-6 w-6" />} value="آلاف" label="عميل يومياً" />
            <StatCard icon={<Radio className="h-6 w-6" />} value="24/7" label="تحديث لحظي" />
            <StatCard icon={<Award className="h-6 w-6" />} value="جودة" label="مضمونة" />
          </div>
        </div>
      </section>

      {/* Vision / Mission / Values */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-black sm:text-3xl">رؤيتنا ورسالتنا وقيمنا</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              نعمل بمعايير عالية لنكون الخيار الأول للمواطن الفلسطيني في قطاع المحروقات.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="رؤيتنا"
              text="أن نكون الشركة الرائدة في توزيع المحروقات في فلسطين، بمعايير عالمية للجودة والشفافية والخدمة."
            />
            <FeatureCard
              icon={<HeartHandshake className="h-6 w-6" />}
              title="رسالتنا"
              text="توفير المحروقات بجودة عالية وأسعار عادلة، مع تجربة عميل رقمية تُريح المواطن وتُقرّب المسافات."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-6 w-6" />}
              title="قيمنا"
              text="النزاهة، الشفافية، خدمة المجتمع، الالتزام بالمواعيد، والاستثمار في التكنولوجيا لخدمة عملائنا."
            />
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-black sm:text-3xl">لماذا الهدى؟</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            نلتزم بأن نكون أكثر من مجرد محطة وقود.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={<Radio className="h-6 w-6" />} title="تحديث فوري" text="تعرف على توفر الوقود قبل مغادرة منزلك." />
          <FeatureCard icon={<MapPin className="h-6 w-6" />} title="شبكة واسعة" text="محطاتنا منتشرة في معظم محافظات الضفة." />
          <FeatureCard icon={<ShieldCheck className="h-6 w-6" />} title="جودة موثوقة" text="مصادر معتمدة وفحوصات دورية للجودة." />
          <FeatureCard icon={<TrendingUp className="h-6 w-6" />} title="تطور مستمر" text="نستثمر في التكنولوجيا لخدمة أفضل." />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary py-16 text-secondary-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-black sm:text-3xl">ابحث عن أقرب محطة وقود</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-secondary-foreground/80 sm:text-base">
            استعرض جميع محطات الهدى للمحروقات مع توفر الوقود المباشر.
          </p>
          <div className="mt-6">
            <Link to="/">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Fuel className="ml-2 h-5 w-5" /> عرض المحطات الآن
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Card className="p-5">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div className="mt-3 text-2xl font-black text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Card className="p-6">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </Card>
  );
}


function Footer() {
  return (
    <footer className="border-t bg-background py-8">
      <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} شركة الهدى للمحروقات. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
