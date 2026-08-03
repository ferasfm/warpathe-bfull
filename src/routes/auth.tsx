import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Fuel, ArrowRight } from "lucide-react";
import { toast } from "sonner";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("فشل تسجيل الدخول: " + error.message);
      return;
    }
    toast.success("مرحباً بك!");
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const r = (roles ?? []).map((x) => x.role);
    if (r.includes("super_admin")) nav({ to: "/admin" });
    else nav({ to: "/manager" });
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
