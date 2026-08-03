import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { Fuel, Flame, Droplet, Truck, Radio, Bell, MapPin, ShieldCheck, Clock, Building2, Phone } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "خدماتنا — شركة الهدى للمحروقات" },
      { name: "description", content: "خدمات شركة الهدى للمحروقات: بنزين 95 و 98، سولار، كاز، غاز، وتحديث فوري لتوفر الوقود في محطاتنا بالضفة الغربية." },
      { property: "og:title", content: "خدماتنا — شركة الهدى للمحروقات" },
      { property: "og:description", content: "تعرّف على خدمات ومنتجات شركة الهدى للمحروقات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 20% 30%, oklch(0.55 0.22 27) 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary-foreground ring-1 ring-primary/40">
            <Fuel className="h-3 w-3" /> خدماتنا
          </div>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">
            كل ما تحتاجه من <span className="text-primary">المحروقات</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-secondary-foreground/80 sm:text-lg">
            نوفّر جميع أنواع الوقود بجودة عالية عبر شبكة محطاتنا في الضفة الغربية،
            مع خدمات رقمية تجعل تجربتك أسرع وأسهل.
          </p>
        </div>
      </section>

      {/* Fuel types */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-black sm:text-3xl">أنواع الوقود المتوفرة</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            نلتزم بتوفير أعلى مستويات الجودة في كل نوع من منتجاتنا.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FuelCard icon={<Fuel className="h-6 w-6" />} title="بنزين 95" text="بنزين خالٍ من الرصاص بأوكتان 95، مناسب لأغلب السيارات الحديثة." />
          <FuelCard icon={<Fuel className="h-6 w-6" />} title="بنزين 98" text="بنزين ممتاز بأوكتان 98، لأداء أعلى ومحركات عالية الأداء." />
          <FuelCard icon={<Droplet className="h-6 w-6" />} title="سولار (ديزل)" text="سولار عالي الجودة للمركبات الثقيلة والشاحنات والمولدات." />
          <FuelCard icon={<Flame className="h-6 w-6" />} title="كاز" text="كاز التدفئة والاستخدامات المنزلية، بأسعار عادلة وجودة موثوقة." />
          <FuelCard icon={<Flame className="h-6 w-6" />} title="غاز" text="غاز الطهي المنزلي، متوفر بشكل دائم في محطاتنا." />
          <FuelCard icon={<Truck className="h-6 w-6" />} title="خدمات المركبات" text="محطاتنا مجهزة لخدمة السيارات والشاحنات على مدار اليوم." />
        </div>
      </section>

      {/* Digital services */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-black sm:text-3xl">خدماتنا الرقمية</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              وفرنا لك تجربة رقمية متكاملة توفر وقتك.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={<Radio className="h-6 w-6" />} title="تحديث لحظي" text="حالة توفر الوقود تتحدث فوراً عبر منصتنا." />
            <FeatureCard icon={<Bell className="h-6 w-6" />} title="إشعارات فورية" text="اشترك واحصل على تنبيه فور توفر الوقود في محطتك." />
            <FeatureCard icon={<MapPin className="h-6 w-6" />} title="أقرب محطة" text="حدد موقعك واعرف أقرب محطة إليك مع المسافة الدقيقة." />
            <FeatureCard icon={<Clock className="h-6 w-6" />} title="أوقات الوصول" text="نُعلن الوقت المتوقع لوصول شحنات الوقود القادمة." />
          </div>
        </div>
      </section>

      {/* For businesses */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Building2 className="h-3 w-3" /> للشركات والمؤسسات
            </div>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">حلول المحروقات للأعمال</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              نقدّم للشركات والمؤسسات وأصحاب أساطيل النقل حلولاً مخصصة لتوريد الوقود
              بأسعار تنافسية وعقود مرنة. تواصل معنا لمناقشة احتياجاتك.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-foreground">
              <ListItem>عقود توريد طويلة الأمد</ListItem>
              <ListItem>أسعار خاصة للأساطيل والمؤسسات</ListItem>
              <ListItem>تقارير استهلاك دورية</ListItem>
              <ListItem>خدمة عملاء مخصصة</ListItem>
            </ul>
          </div>
          <Card className="p-8">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Phone className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-bold">تواصل مع فريق الأعمال</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              فريقنا جاهز لمساعدتك في اختيار الحل المناسب لأعمالك.
            </p>
            <div className="mt-6 grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> عقود موثوقة وشفافة
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" /> خدمة على مدار الساعة
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" /> تغطية واسعة في الضفة
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary py-16 text-secondary-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-black sm:text-3xl">تحقّق من توفر الوقود الآن</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-secondary-foreground/80 sm:text-base">
            استعرض جميع محطاتنا وتوفر أنواع الوقود بشكل لحظي.
          </p>
          <div className="mt-6">
            <Link to="/">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Fuel className="ml-2 h-5 w-5" /> عرض المحطات
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FuelCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Card className="group p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md">{icon}</div>
      <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
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

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1 grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="h-3 w-3" />
      </span>
      <span>{children}</span>
    </li>
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
