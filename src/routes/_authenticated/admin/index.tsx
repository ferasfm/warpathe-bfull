import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Shield, Key, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/")({
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
        <Card className="hover:border-primary/50 transition-colors">
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
                  <div className="font-bold">إدارة الأدوار</div>
                  <div className="text-xs text-muted-foreground">تغيير صلاحيات SUPER_ADMIN و ADMIN و USER</div>
                </div>
                <Link to="/admin/users">
                  <Button size="sm" variant="outline">
                    فتح الإدارة
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                </Link>
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
            <div className="flex items-center gap-2 p-4 text-sm bg-muted/50 text-muted-foreground border border-dashed rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>متاح في المرحلة القادمة (Phase 03).</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
