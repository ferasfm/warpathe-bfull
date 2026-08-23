import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getMonitoringMetrics, getPaginatedLogs } from '@/lib/monitoring.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  Server, 
  Monitor, 
  PlayCircle, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const Route = createFileRoute('/_authenticated/admin/monitoring')({
  component: MonitoringDashboard,
});

function MonitoringDashboard() {
  const [page, setPage] = useState(0);
  const metricsQuery = useSuspenseQuery({
    queryKey: ['monitoring-metrics'],
    queryFn: () => getMonitoringMetrics(),
    refetchInterval: 10000, // 10s polling
  });

  const logsQuery = useSuspenseQuery({
    queryKey: ['monitoring-logs', page],
    queryFn: () => getPaginatedLogs({ data: { page, pageSize: 15 } }),
    refetchInterval: 5000,
  });

  const metrics = metricsQuery.data;
  const logs = logsQuery.data.logs;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agents</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.agents.total}</div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-green-500 font-medium">{metrics.agents.online} Online</span>
              <span className="text-xs text-red-400 font-medium">{metrics.agents.offline} Offline</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MuMu Emulators</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.emulators.total}</div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-orange-500 font-medium">{metrics.emulators.busy} Busy</span>
              <span className="text-xs text-blue-400 font-medium">{metrics.emulators.idle} Idle</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missions Running</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.missions.running}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active mission execution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Failures</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.missions.failedToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Failed runs since midnight
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Live Logs */}
        <Card className="md:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Live Operational Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto border rounded-lg">
              <table className="w-full text-sm text-left text-muted-foreground">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Event Type</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {format(new Date(log.created_at), 'HH:mm:ss.SSS')}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {log.agents?.name || 'System'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {log.event_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          log.payload?.severity === 'ERROR' ? 'bg-red-500/10 text-red-500' :
                          log.payload?.severity === 'WARN' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {log.payload?.severity || 'INFO'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs max-w-md truncate">
                        {log.payload?.message || JSON.stringify(log.payload)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-muted-foreground">
                Showing {logs.length} events
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => p + 1)}
                  disabled={logs.length < 15}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
