import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getMissionTimeline } from '@/lib/monitoring.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/missions/runs/$runId')({
  component: MissionRunDetails,
});

function MissionRunDetails() {
  const { runId } = Route.useParams();
  const timelineQuery = useSuspenseQuery({
    queryKey: ['mission-timeline', runId],
    queryFn: () => getMissionTimeline({ data: { missionRunId: runId } }),
    refetchInterval: 5000,
  });

  const events = timelineQuery.data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Mission Run Timeline</h1>
        <Badge variant="outline">{runId}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Execution Chronology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative border-l-2 border-muted ml-3 pl-6 space-y-6">
            {events.map((event: any) => (
              <div key={event.id} className="relative">
                <div className="absolute -left-[33px] top-1 bg-background p-0.5 rounded-full">
                  {event.severity === 'ERROR' || event.severity === 'CRITICAL' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : event.event_type === 'MISSION_FINISHED' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{event.event_type}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(event.created_at), 'HH:mm:ss.SSS')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{event.message}</p>
                  {event.payload && Object.keys(event.payload).length > 0 && (
                    <pre className="text-[10px] bg-muted/50 p-2 rounded mt-2 overflow-x-auto">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Waiting for events...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
