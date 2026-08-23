import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmulators, createEmulator, updateEmulator, deleteEmulator, getAgents, getDevices } from '@/lib/agent.functions';
import { getFarms } from '@/lib/farm.functions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/emulators')({
  component: AdminEmulatorsPage,
});

function AdminEmulatorsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmulator, setEditingEmulator] = useState<any>(null);

  const { data: emulators, isLoading } = useQuery({
    queryKey: ['admin', 'emulators'],
    queryFn: () => getEmulators({}),
  });


  const { data: agents } = useQuery({
    queryKey: ['admin', 'agents'],
    queryFn: () => getAgents({}),
  });


  const { data: devices } = useQuery({
    queryKey: ['admin', 'devices'],
    queryFn: () => getDevices({}),
  });


  const { data: farms } = useQuery({
    queryKey: ['admin', 'farms'],
    queryFn: () => getFarms({}),
  });


  const createMutation = useMutation({
    mutationFn: createEmulator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'emulators'] });
      setIsDialogOpen(false);
      toast.success('Emulator record created');
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: updateEmulator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'emulators'] });
      setIsDialogOpen(false);
      setEditingEmulator(null);
      toast.success('Emulator record updated');
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmulator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'emulators'] });
      toast.success('Emulator record deleted');
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      agent_id: formData.get('agent_id') as string,
      device_id: formData.get('device_id') as string,
      assigned_farm_id: formData.get('assigned_farm_id') as string || null,
      resolution: formData.get('resolution') as string || '1012x800',
      dpi: parseInt(formData.get('dpi') as string) || 200,
      status: formData.get('status') as string || 'OFFLINE',
    };

    if (editingEmulator) {
      updateMutation.mutate({ data: { id: editingEmulator.id, ...data } });
    } else {
      createMutation.mutate({ data });
    }

  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MuMu Emulators</h1>
          <p className="text-muted-foreground">Manage emulator instances and farm assignments.</p>
        </div>
        <Button onClick={() => { setEditingEmulator(null); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Emulator
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Farm</TableHead>
              <TableHead>Resolution/DPI</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-left">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading emulators...</TableCell>
              </TableRow>
            ) : emulators?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">No emulators configured.</TableCell>
              </TableRow>
            ) : (
              emulators?.map((emu: any) => (
                <TableRow key={emu.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      {emu.name}
                    </div>
                  </TableCell>
                  <TableCell>{emu.agents?.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{emu.devices?.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{emu.devices?.device_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {emu.farms ? (
                      <Badge variant="outline">{emu.farms.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {emu.resolution} @ {emu.dpi}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={emu.status === 'ONLINE' ? 'default' : 'secondary'}>
                      {emu.status || 'UNKNOWN'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setEditingEmulator(emu); setIsDialogOpen(true); }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this emulator record?')) {
                            deleteMutation.mutate({ data: { id: emu.id } });
                          }

                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingEmulator ? 'Edit Emulator' : 'Add Emulator'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Emulator Name</Label>
                <Input id="name" name="name" defaultValue={editingEmulator?.name} placeholder="MuMu-01" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="agent_id">Agent</Label>
                <Select name="agent_id" defaultValue={editingEmulator?.agent_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents?.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="device_id">Linked Device</Label>
                <Select name="device_id" defaultValue={editingEmulator?.device_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Device" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices?.map((device: any) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name} ({device.device_id.substring(0, 8)}...)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assigned_farm_id">Farm Assignment (Optional)</Label>
                <Select name="assigned_farm_id" defaultValue={editingEmulator?.assigned_farm_id || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="No Farm Assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {farms?.map((farm: any) => (
                      <SelectItem key={farm.id} value={farm.id}>{farm.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Input id="resolution" name="resolution" defaultValue={editingEmulator?.resolution || "1012x800"} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dpi">DPI</Label>
                  <Input id="dpi" name="dpi" type="number" defaultValue={editingEmulator?.dpi || 200} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select name="status" defaultValue={editingEmulator?.status || "OFFLINE"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFLINE">OFFLINE</SelectItem>
                    <SelectItem value="ONLINE">ONLINE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingEmulator ? 'Save Changes' : 'Create Emulator'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
