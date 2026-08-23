import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Building2, 
  Map, 
  Zap, 
  Target, 
  Cpu, 
  Smartphone, 
  Monitor,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const adminStatsQueryOptions = queryOptions({
  queryKey: ["admin-stats"],
  queryFn: () => getAdminStats(),
  refetchInterval: 30000, // Refresh every 30 seconds
});

export const Route = createFileRoute("/_authenticated/admin/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminStatsQueryOptions),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useSuspenseQuery(adminStatsQueryOptions);

  const summaryCards = [
    { label: "Total Users", value: stats.users || 0, icon: Users },
    { label: "Total Accounts", value: stats.accounts || 0, icon: Building2 },
    { label: "Total Farms", value: stats.farms || 0, icon: Map },
    { label: "Total Fleets", value: stats.fleets || 0, icon: Zap },
    { label: "Total Missions", value: stats.missions || 0, icon: Target },
    { label: "Total Agents", value: stats.agents || 0, icon: Cpu },
    { label: "Total Devices", value: stats.devices || 0, icon: Smartphone },
    { label: "Total Emulators", value: stats.emulators || 0, icon: Monitor },
  ];

  const statusItems = [
    { label: "Database", status: "Operational", color: "text-green-500" },
    { label: "Authentication", status: "Operational", color: "text-green-500" },
    { label: "Agents", status: stats.onlineAgents > 0 ? "Active" : "Idle", color: stats.onlineAgents > 0 ? "text-green-500" : "text-yellow-500" },
    { label: "Devices", status: stats.devices > 0 ? "Connected" : "None", color: stats.devices > 0 ? "text-green-500" : "text-slate-500" },
    { label: "Missions", status: stats.activeMissions > 0 ? "Processing" : "Waiting", color: stats.activeMissions > 0 ? "text-blue-500" : "text-slate-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">System-wide operational overview and infrastructure metrics.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Operational Status */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Operational Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="text-sm font-medium text-green-600 dark:text-green-400">Online Agents</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.onlineAgents || 0}</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-500/5 border border-slate-500/20">
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Offline Agents</div>
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{stats.offlineAgents || 0}</div>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Missions</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.activeMissions || 0}</div>
              </div>
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="text-sm font-medium text-red-600 dark:text-red-400">Failed Missions</div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.failedMissions || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                  <span className="font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${item.color}`}>{item.status}</span>
                    <div className={`w-2 h-2 rounded-full ${item.color.replace('text', 'bg')}`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground flex items-center justify-center h-24 border border-dashed rounded-lg">
            No recent activity data available.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
