import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getDevices } from '@/lib/agent.functions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const Route = createFileRoute('/_authenticated/admin/devices')({
  component: AdminDevicesPage,
});

function AdminDevicesPage() {
  const { data: devices, isLoading } = useQuery({
    queryKey: ['admin', 'devices'],
    queryFn: () => getDevices(),
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
          <p className="text-muted-foreground">View connected hardware and emulated devices.</p>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading devices...</TableCell>
              </TableRow>
            ) : devices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">No devices registered.</TableCell>
              </TableRow>
            ) : (
              devices?.map((device: any) => (
                <TableRow key={device.id}>
                  <TableCell className="font-mono text-xs">{device.device_id}</TableCell>
                  <TableCell className="font-medium">{device.name || 'Unnamed Device'}</TableCell>
                  <TableCell>{device.agents?.name || 'Unknown Agent'}</TableCell>
                  <TableCell>
                    <Badge variant={device.status === 'CONNECTED' ? 'default' : 'secondary'}>
                      {device.status || 'UNKNOWN'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {device.created_at ? format(new Date(device.created_at), 'MMM d, yyyy') : 'N/A'}
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
