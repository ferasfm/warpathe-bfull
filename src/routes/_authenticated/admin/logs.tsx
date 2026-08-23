import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '@/lib/admin-logs.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/admin/logs')({
  component: AdminLogsPage,
});

function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => getAuditLogs({ data: { page } }),
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Audit Logs</h1>
      <Card>
        <CardHeader>
          <CardTitle>System Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
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
                {data?.logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell>{log.entity_id}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{JSON.stringify(log.metadata)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
