import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Fuel, ArrowRight, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { trackLoginAttempt, checkIpStatus } from "@/lib/auth-security.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "دخول الإدارة — شركة الهدى للمحروقات" },
      { name: "description", content: "صفحة دخول مديري المحطات والإدارة الرئيسية لشركة الهدى." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const trackAttempt = useServerFn(trackLoginAttempt);
  const checkIp = useServerFn(checkIpStatus);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    checkIp().then((res) => {
      if (res.isBlocked) setIsBlocked(true);
    });
  }, [checkIp]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
        const r = (roles ?? []).map((x) => x.role);
        if (r.includes("super_admin")) nav({ to: "/admin" });
        else nav({ to: "/manager" });
      }
    });
  }, [nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const status = await checkIp();
      if (status.isBlocked) {
        setIsBlocked(true);
        toast.error("تم حظر هذا العنوان مؤقتاً بسبب محاولات دخول خاطئة متعددة.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        await trackAttempt({ data: { is_successful: false } });
        // Re-check status after a failed attempt
        const newStatus = await checkIp();
        if (newStatus.isBlocked) setIsBlocked(true);
        
        toast.error("فشل تسجيل الدخول: " + error.message);
        setLoading(false);
        return;
      }

      await trackAttempt({ data: { is_successful: true } });
      toast.success("مرحباً بك!");
      
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      const r = (roles ?? []).map((x) => x.role);
      if (r.includes("super_admin")) nav({ to: "/admin" });
      else nav({ to: "/manager" });
    } catch (err) {
      toast.error("حدث خطأ أثناء محاولة تسجيل الدخول");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-secondary px-4" dir="rtl">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-secondary-foreground hover:text-primary">
          <ArrowRight className="h-4 w-4" />
          <span className="text-sm">العودة للرئيسية</span>
        </Link>

        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary shadow-lg">
              <Fuel className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">دخول الإدارة</CardTitle>
            <CardDescription>مديري المحطات والإدارة الرئيسية فقط</CardDescription>
          </CardHeader>
          <CardContent>
            {isBlocked ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
                <div className="rounded-full bg-destructive/10 p-3 text-destructive">
                  <ShieldAlert className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-destructive">تم حظر الوصول مؤقتاً</h3>
                  <p className="text-sm text-muted-foreground px-4">
                    لقد تجاوزت الحد المسموح لمحاولات الدخول الخاطئة (3 محاولات).
                    تم حظر هذا الجهاز لمدة 24 ساعة لضمان أمن النظام.
                  </p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>تحديث الصفحة</Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "جاري الدخول..." : "تسجيل الدخول"}
                </Button>
                <p className="pt-2 text-center text-xs text-muted-foreground">
                  لا يوجد تسجيل ذاتي. يقوم الأدمن الرئيسي بإنشاء الحسابات.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
