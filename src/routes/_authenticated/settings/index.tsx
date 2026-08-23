import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings2, Bell, Shield, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings/index")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-black tracking-tight">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">تخصيص تجربتك في WARPATH</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              الملف الشخصي
            </CardTitle>
            <CardDescription>إدارة معلومات حسابك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground italic">سيتم عرض تفاصيل المستخدم هنا في المرحلة القادمة.</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              التنبيهات
            </CardTitle>
            <CardDescription>كيف ومتى تريد أن يتم إخطارك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-2">
              <span>تنبيهات النظام المباشرة</span>
              <div className="w-10 h-5 bg-muted rounded-full relative">
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
