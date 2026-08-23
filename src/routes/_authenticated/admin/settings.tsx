import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSystemSettings, updateSystemSetting } from '@/lib/admin-logs.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/admin/settings')({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => getSystemSettings(),
  });

  const mutation = useMutation({
    mutationFn: updateSystemSetting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-settings'] }),
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">System Settings</h1>
      <div className="grid gap-4">
        {settings?.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-lg">{s.key}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">{s.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Input 
                  defaultValue={JSON.stringify(s.value)} 
                  onBlur={(e) => {
                    try {
                      const val = JSON.parse(e.target.value);
                      mutation.mutate({ id: s.id, key: s.key, value: val });
                    } catch {
                      // Silently fail or show error
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
