import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Server, Cpu, Globe } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-black tracking-tight">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-1">نظرة عامة على حالة منصة WARPATH</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="الحالات النشطة" value="0" icon={<Activity className="w-4 h-4" />} />
        <StatCard title="الوكلاء المتصلون" value="0" icon={<Server className="w-4 h-4" />} />
        <StatCard title="إجمالي العمليات" value="0" icon={<Cpu className="w-4 h-4" />} />
        <StatCard title="وقت التشغيل" value="100%" icon={<Globe className="w-4 h-4" />} />
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>حالة النظام المباشرة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
            بانتظار اتصال الوكيل (Phase 02)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
