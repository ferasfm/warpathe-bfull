import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Shield, Key, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  beforeLoad: async ({ context }) => {
    // Basic check for admin role using the has_role function
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });

    const { data: hasAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdmin) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-black tracking-tight">إدارة النظام</h1>
        <p className="text-muted-foreground mt-1">إدارة المستخدمين والصلاحيات والإعدادات المتقدمة</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              المستخدمون
            </CardTitle>
            <CardDescription>إدارة حسابات الفريق ووصولهم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50 flex items-center justify-between">
                <div>
                  <div className="font-bold">قائمة المستخدمين</div>
                  <div className="text-xs text-muted-foreground italic">سيتم تفعيلها في Phase 02</div>
                </div>
                <Shield className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              مفاتيح API
            </CardTitle>
            <CardDescription>إدارة الاتصال مع Windows Agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-4 text-sm bg-warning/10 text-warning-foreground border border-warning/20 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>لا توجد مفاتيح نشطة حالياً.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
