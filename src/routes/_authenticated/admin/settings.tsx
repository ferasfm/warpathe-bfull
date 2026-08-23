import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSystemSettings, updateSystemSetting } from '@/lib/admin-logs.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/settings')({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => getSystemSettings(),
  });

  const mutation = useMutation({
    mutationFn: (args: { id?: string; key: string; value: any; description?: string }) => 
      updateSystemSetting({ data: args }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Setting updated successfully');
    },
    onError: (err: any) => {
      toast.error(`Failed to update setting: ${err.message}`);
    }
  });

  if (isLoading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">System Settings</h1>
      <div className="grid gap-4">
        {settings?.map((s: any) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-lg">{s.key}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{s.description || 'No description provided.'}</p>
              <div className="flex items-center gap-4">
                <Input 
                  defaultValue={typeof s.value === 'string' ? s.value : JSON.stringify(s.value)} 
                  className="max-w-md"
                  onBlur={(e) => {
                    const newVal = e.target.value;
                    let parsedVal = newVal;
                    try {
                      // Attempt to parse as JSON if it looks like it
                      if ((newVal.startsWith('{') && newVal.endsWith('}')) || (newVal.startsWith('[') && newVal.endsWith(']'))) {
                        parsedVal = JSON.parse(newVal);
                      }
                    } catch (e) {
                      // Keep as string if parsing fails
                    }
                    
                    if (JSON.stringify(parsedVal) !== JSON.stringify(s.value)) {
                      mutation.mutate({ 
                        id: s.id, 
                        key: s.key, 
                        value: parsedVal,
                        description: s.description 
                      });
                    }
                  }}
                />
                {s.is_sensitive && <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Sensitive</span>}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Last updated: {s.updated_at ? new Date(s.updated_at).toLocaleString() : 'Never'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
