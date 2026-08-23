import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAgents } from '@/lib/agent.functions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const Route = createFileRoute('/_authenticated/admin/agents')({
  component: AdminAgentsPage,
});

function AdminAgentsPage() {
  const { data: agents, isLoading } = useQuery({
    queryKey: ['admin', 'agents'],
    queryFn: () => getAgents({}),
  });


  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-500';
      case 'OFFLINE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">Monitor registered Windows agents.</p>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Hostname</TableHead>
              <TableHead>Last Heartbeat</TableHead>
              <TableHead>Created Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading agents...</TableCell>
              </TableRow>
            ) : agents?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">No agents registered.</TableCell>
              </TableRow>
            ) : (
              agents?.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                      <Badge variant="outline">{agent.status || 'UNKNOWN'}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{agent.version || 'N/A'}</TableCell>
                  <TableCell>{agent.hostname || 'N/A'}</TableCell>
                  <TableCell>
                    {agent.last_heartbeat ? format(new Date(agent.last_heartbeat), 'MMM d, HH:mm:ss') : 'Never'}
                  </TableCell>
                  <TableCell>
                    {agent.created_at ? format(new Date(agent.created_at), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
