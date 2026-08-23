import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getUserDashboardData } from "@/lib/dashboard.functions";
import { 
  LayoutDashboard, 
  Sprout, 
  Activity, 
  Settings, 
  Box,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: UserDashboard,
});

function UserDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-dashboard"],
    queryFn: () => getUserDashboardData(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">Error loading dashboard</h2>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter">Welcome, {data.user.fullName}</h1>
        <p className="text-muted-foreground">Manage your farms and automation status.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assigned Farms</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalFarms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Farms</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.activeFarms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Global Status</CardTitle>
            <Badge variant="secondary">{data.automationStatus}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">IDLE</div>
          </CardContent>
        </Card>
      </div>

      {/* Farms List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sprout className="w-5 h-5" />
          My Farms
        </h2>
        
        {data.farms.length === 0 ? (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
              <Box className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No farms assigned yet.</p>
              <p className="text-xs text-muted-foreground/60">Contact an administrator to get access.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.farms.map((farm) => (
              <Card key={farm.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{farm.name}</CardTitle>
                      <CardDescription>{farm.accountName}</CardDescription>
                    </div>
                    <Badge variant={farm.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {farm.status || 'INACTIVE'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex gap-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Box className="w-4 h-4" />
                        {farm.fleetCount} Fleets
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs block text-muted-foreground uppercase mb-1">Automation</span>
                      <Badge variant="outline" className={`text-[10px] font-bold ${farm.activeMission ? 'text-primary border-primary animate-pulse' : ''}`}>
                        {farm.activeMission ? 'RUNNING' : 'IDLE'}
                      </Badge>
                    </div>
                  </div>
                  
                  {farm.activeMission && (
                    <div className="pt-2 border-t space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium">Current: {farm.activeMission.missions?.name}</span>
                        <span className="text-muted-foreground uppercase text-[10px]">{farm.activeMission.last_event_type || 'STARTING'}</span>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(5, (farm.activeMission.current_step_index / (farm.activeMission.total_steps || 10)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Mission Config Placeholder */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Available Missions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.missions.length > 0 ? (
            data.missions.map(mission => (
              <Card key={mission.id} className="bg-accent/50">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">{mission.name}</CardTitle>
                  {mission.description && (
                    <CardDescription className="text-xs line-clamp-1">{mission.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-sm italic">No active missions available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
