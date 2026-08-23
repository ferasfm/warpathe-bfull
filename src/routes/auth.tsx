import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert, Terminal } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { trackLoginAttempt, checkIpStatus } from "@/lib/auth-security.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — WARPATH" },
      { name: "description", content: "تسجيل الدخول لمنصة الأتمتة WARPATH" },
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
        nav({ to: "/" });
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
        const newStatus = await checkIp();
        if (newStatus.isBlocked) setIsBlocked(true);
        
        toast.error("فشل تسجيل الدخول: " + error.message);
        setLoading(false);
        return;
      }

      await trackAttempt({ data: { is_successful: true } });
      toast.success("مرحباً بك!");
      nav({ to: "/" });
    } catch (err) {
      toast.error("حدث خطأ أثناء محاولة تسجيل الدخول");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4" dir="rtl">
      <div className="w-full max-w-md">
        <Card className="border-2 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary shadow-lg">
              <Terminal className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter uppercase">WARPATH</CardTitle>
            <CardDescription className="font-medium">AUTOMATION PLATFORM</CardDescription>
          </CardHeader>
          <CardContent>
            {isBlocked ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
                <div className="rounded-full bg-destructive/10 p-3 text-destructive">
                  <ShieldAlert className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-destructive text-lg">تم حظر الوصول مؤقتاً</h3>
                  <p className="text-sm text-muted-foreground px-4">
                    لقد تجاوزت الحد المسموح لمحاولات الدخول الخاطئة.
                    تم حظر هذا الجهاز لمدة 24 ساعة لضمان أمن المنصة.
                  </p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()} className="w-full">تحديث الصفحة</Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">كلمة المرور</Label>
                  </div>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
                </div>
                <Button type="submit" className="w-full h-11 text-base font-bold" disabled={loading}>
                  {loading ? "جاري الدخول..." : "دخول المنصة"}
                </Button>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">أو</span></div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  type="button"
                  onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })}
                >
                  الدخول بواسطة Google
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <p className="mt-8 text-center text-xs text-muted-foreground uppercase tracking-widest font-black opacity-50">
          WARPATH FOUNDATION PHASE 01
        </p>
      </div>
    </div>
  );
}
