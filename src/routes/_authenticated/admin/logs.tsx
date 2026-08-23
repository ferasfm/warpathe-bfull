import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs, getAgentEvents, getAiVisionLogs } from '@/lib/admin-logs.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/admin/logs')({
  component: AdminLogsPage,
});

function AdminLogsPage() {
  const [auditPage, setAuditPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const [visionPage, setVisionPage] = useState(1);


  const { data: auditData, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['audit-logs', auditPage],
    queryFn: () => getAuditLogs({ data: { page: auditPage } }),
  });

  const { data: eventData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['agent-events', eventPage],
    queryFn: () => getAgentEvents({ data: { page: eventPage } }),
  });

  const { data: visionData, isLoading: isLoadingVision } = useQuery({
    queryKey: ['ai-vision-logs', visionPage],
    queryFn: () => getAiVisionLogs({ data: { page: visionPage } }),
  });


  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Logs & Events</h1>
      
      <Tabs defaultValue="audit">
        <TabsList>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="events">Agent Events</TabsTrigger>
          <TabsTrigger value="ai-vision">AI Vision Logs</TabsTrigger>
        </TabsList>


        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAudit ? (
                <div className="py-10 text-center">Loading audit logs...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Metadata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditData?.logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>{log.entity_type}</TableCell>
                        <TableCell className="font-mono text-xs">{log.entity_id}</TableCell>
                        <TableCell className="max-w-[300px] truncate font-mono text-xs">
                          {JSON.stringify(log.metadata)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {auditData?.logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No audit logs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Operational Events</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEvents ? (
                <div className="py-10 text-center">Loading agent events...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Payload</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventData?.events.map((event: any) => (
                      <TableRow key={event.id}>
                        <TableCell>{new Date(event.created_at).toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs">{event.agent_id}</TableCell>
                        <TableCell className="font-mono text-xs">{event.device_id || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{event.event_type}</TableCell>
                        <TableCell className="max-w-[300px] truncate font-mono text-xs">
                          {JSON.stringify(event.payload)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {eventData?.events.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No agent events found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-vision" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Vision Fallback Auditing</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingVision ? (
                <div className="py-10 text-center">Loading AI vision logs...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Mission</TableHead>
                      <TableHead>Provider/Model</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Conf</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visionData?.logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs">{log.mission_run_id || 'Manual'}</TableCell>
                        <TableCell>{log.provider} / {log.model}</TableCell>
                        <TableCell className="max-w-[200px] truncate font-mono text-xs text-blue-600">
                          {JSON.stringify(log.result)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.confidence ? `${(log.confidence * 100).toFixed(1)}%` : '0%'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{log.processing_time_ms}ms</TableCell>
                      </TableRow>
                    ))}
                    {visionData?.logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No AI vision logs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
