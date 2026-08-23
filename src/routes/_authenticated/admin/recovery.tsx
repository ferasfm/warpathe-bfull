import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getRecoveryRules, 
  createRecoveryRule, 
  updateRecoveryRule, 
  deleteRecoveryRule 
} from '@/lib/vision.functions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, ShieldAlert, FileJson } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/recovery')({
  component: AdminRecoveryPage,
});

function AdminRecoveryPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['admin', 'recovery-rules'],
    queryFn: () => getRecoveryRules({}),
  });

  const createMutation = useMutation({
    mutationFn: createRecoveryRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recovery-rules'] });
      setIsDialogOpen(false);
      toast.success('Recovery rule created');
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: updateRecoveryRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recovery-rules'] });
      setIsDialogOpen(false);
      setEditingRule(null);
      toast.success('Recovery rule updated');
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecoveryRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recovery-rules'] });
      toast.success('Recovery rule deleted');
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    let config = {};
    try {
      config = JSON.parse(formData.get('configuration') as string || '{}');
    } catch (e) {
      toast.error('Invalid JSON configuration');
      return;
    }

    const ruleData = {
      name: formData.get('name') as string,
      trigger_type: formData.get('trigger_type') as string,
      priority: parseInt(formData.get('priority') as string) || 10,
      active: formData.get('active') === 'true',
      configuration: config
    };

    if (editingRule) {
      updateMutation.mutate({ data: { id: editingRule.id, ...ruleData } });
    } else {
      createMutation.mutate({ data: ruleData });
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority <= 1) return <Badge className="bg-red-600">Critical (1)</Badge>;
    if (priority <= 5) return <Badge className="bg-orange-500">High ({priority})</Badge>;
    return <Badge variant="outline">Normal ({priority})</Badge>;
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recovery Rules</h1>
          <p className="text-muted-foreground">Configure triggers and automated recovery strategies.</p>
        </div>
        <Button onClick={() => { setEditingRule(null); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Recovery Rule
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Priority</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Trigger Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-left">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading rules...</TableCell></TableRow>
            ) : rules?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">No recovery rules configured.</TableCell></TableRow>
            ) : (
              rules?.map((rule: any) => (
                <TableRow key={rule.id}>
                  <TableCell>{getPriorityBadge(rule.priority)}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                      {rule.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.trigger_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.active ? 'default' : 'secondary'}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingRule(rule); setIsDialogOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => { if (confirm('Delete this recovery rule?')) deleteMutation.mutate({ data: { id: rule.id } }); }}
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
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Recovery Rule' : 'Add Recovery Rule'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input id="name" name="name" defaultValue={editingRule?.name} placeholder="Critical Popup Handler" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trigger_type">Trigger Type</Label>
                <Select name="trigger_type" defaultValue={editingRule?.trigger_type || "POPUP"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POPUP">POPUP</SelectItem>
                    <SelectItem value="ERROR">ERROR</SelectItem>
                    <SelectItem value="TIMEOUT">TIMEOUT</SelectItem>
                    <SelectItem value="UNKNOWN_SCREEN">UNKNOWN_SCREEN</SelectItem>
                    <SelectItem value="LOGIN_SCREEN">LOGIN_SCREEN</SelectItem>
                    <SelectItem value="ADB_DISCONNECTED">ADB_DISCONNECTED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority (Lower = Higher Priority)</Label>
                <Input id="priority" name="priority" type="number" defaultValue={editingRule?.priority || 10} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="configuration">Recovery Strategy (JSON)</Label>
                <Textarea 
                  id="configuration" 
                  name="configuration" 
                  rows={8}
                  defaultValue={JSON.stringify(editingRule?.configuration || { steps: [] }, null, 2)} 
                  className="font-mono text-xs"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="active">Status</Label>
                <Select name="active" defaultValue={editingRule?.active === false ? "false" : "true"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingRule ? 'Save Changes' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
