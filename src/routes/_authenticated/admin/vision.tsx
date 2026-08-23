import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getVisionAssets, 
  createVisionAsset, 
  updateVisionAsset, 
  deleteVisionAsset,
  getVisionRules,
  createVisionRule,
  updateVisionRule,
  deleteVisionRule
} from '@/lib/vision.functions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Eye, Upload, FileJson, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute('/_authenticated/admin/vision')({
  component: AdminVisionPage,
});

function AdminVisionPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('assets');
  
  // Asset Dialog State
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Rule Dialog State
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['admin', 'vision-assets'],
    queryFn: () => getVisionAssets({}),
  });

  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['admin', 'vision-rules'],
    queryFn: () => getVisionRules({}),
  });

  // Assets Mutations
  const assetCreateMutation = useMutation({
    mutationFn: createVisionAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vision-assets'] });
      setIsAssetDialogOpen(false);
      toast.success('Vision asset created');
    }
  });

  const assetUpdateMutation = useMutation({
    mutationFn: updateVisionAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vision-assets'] });
      setIsAssetDialogOpen(false);
      toast.success('Vision asset updated');
    }
  });

  const assetDeleteMutation = useMutation({
    mutationFn: deleteVisionAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vision-assets'] });
      toast.success('Vision asset deleted');
    }
  });

  // Rules Mutations
  const ruleCreateMutation = useMutation({
    mutationFn: createVisionRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vision-rules'] });
      setIsRuleDialogOpen(false);
      toast.success('Vision rule created');
    }
  });

  const ruleUpdateMutation = useMutation({
    mutationFn: updateVisionRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vision-rules'] });
      setIsRuleDialogOpen(false);
      toast.success('Vision rule updated');
    }
  });

  const ruleDeleteMutation = useMutation({
    mutationFn: deleteVisionRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vision-rules'] });
      toast.success('Vision rule deleted');
    }
  });

  const handleAssetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('image') as File;
    let storagePath = editingAsset?.storage_path;

    if (file && file.size > 0) {
      setUploading(true);
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('vision-assets-private')
        .upload(fileName, file);
      
      if (error) {
        toast.error('Upload failed: ' + error.message);
        setUploading(false);
        return;
      }
      storagePath = data.path;
      setUploading(false);
    }

    const assetData = {
      name: formData.get('name') as string,
      asset_type: formData.get('asset_type') as string,
      version: formData.get('version') as string,
      active: formData.get('active') === 'true',
      storage_path: storagePath
    };

    if (editingAsset) {
      assetUpdateMutation.mutate({ data: { id: editingAsset.id, ...assetData } });
    } else {
      assetCreateMutation.mutate({ data: assetData });
    }
  };

  const handleRuleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
      asset_id: formData.get('asset_id') as string,
      confidence_threshold: parseFloat(formData.get('confidence_threshold') as string),
      active: formData.get('active') === 'true',
      configuration: config
    };

    if (editingRule) {
      ruleUpdateMutation.mutate({ data: { id: editingRule.id, ...ruleData } });
    } else {
      ruleCreateMutation.mutate({ data: ruleData });
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vision Management</h1>
          <p className="text-muted-foreground">Manage vision assets and recognition rules.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">Vision Assets</TabsTrigger>
          <TabsTrigger value="rules">Vision Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingAsset(null); setIsAssetDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Storage Path</TableHead>
                  <TableHead className="text-left">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetsLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Loading assets...</TableCell></TableRow>
                ) : assets?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center">No assets found.</TableCell></TableRow>
                ) : (
                  assets?.map((asset: any) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell><Badge variant="outline">{asset.asset_type}</Badge></TableCell>
                      <TableCell>{asset.version}</TableCell>
                      <TableCell>
                        <Badge variant={asset.active ? 'default' : 'secondary'}>
                          {asset.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono max-w-[200px] truncate">
                        {asset.storage_path || 'No file'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingAsset(asset); setIsAssetDialogOpen(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => { if(confirm('Delete this asset?')) assetDeleteMutation.mutate({ data: { id: asset.id } }); }}
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
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingRule(null); setIsRuleDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Related Asset</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-left">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rulesLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Loading rules...</TableCell></TableRow>
                ) : rules?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center">No rules found.</TableCell></TableRow>
                ) : (
                  rules?.map((rule: any) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{rule.vision_assets?.name}</TableCell>
                      <TableCell>{(rule.confidence_threshold * 100).toFixed(0)}%</TableCell>
                      <TableCell>
                        <Badge variant={rule.active ? 'default' : 'secondary'}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingRule(rule); setIsRuleDialogOpen(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => { if(confirm('Delete this rule?')) ruleDeleteMutation.mutate({ data: { id: rule.id } }); }}
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
        </TabsContent>
      </Tabs>

      {/* Asset Dialog */}
      <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAssetSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingAsset ? 'Edit Vision Asset' : 'Add Vision Asset'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Asset Name</Label>
                <Input id="name" name="name" defaultValue={editingAsset?.name} placeholder="Wheat Icon" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="asset_type">Asset Type</Label>
                <Select name="asset_type" defaultValue={editingAsset?.asset_type || "RESOURCE"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESOURCE">RESOURCE</SelectItem>
                    <SelectItem value="BUTTON">BUTTON</SelectItem>
                    <SelectItem value="POPUP">POPUP</SelectItem>
                    <SelectItem value="SCREEN">SCREEN</SelectItem>
                    <SelectItem value="ERROR">ERROR</SelectItem>
                    <SelectItem value="OTHER">OTHER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Image File</Label>
                <Input id="image" name="image" type="file" accept="image/*" />
                {editingAsset?.storage_path && <p className="text-xs text-muted-foreground">Current path: {editingAsset.storage_path}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="version">Version</Label>
                <Input id="version" name="version" defaultValue={editingAsset?.version || "1.0.0"} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="active">Status</Label>
                <Select name="active" defaultValue={editingAsset?.active === false ? "false" : "true"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={uploading || assetCreateMutation.isPending || assetUpdateMutation.isPending}>
                {uploading ? 'Uploading...' : editingAsset ? 'Save Changes' : 'Create Asset'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleRuleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Vision Rule' : 'Add Vision Rule'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input id="name" name="name" defaultValue={editingRule?.name} placeholder="Detect Wheat Field" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="asset_id">Related Vision Asset</Label>
                <Select name="asset_id" defaultValue={editingRule?.asset_id} required>
                  <SelectTrigger><SelectValue placeholder="Select Asset" /></SelectTrigger>
                  <SelectContent>
                    {assets?.map((asset: any) => (
                      <SelectItem key={asset.id} value={asset.id}>{asset.name} ({asset.asset_type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confidence_threshold">Confidence Threshold (0.0 - 1.0)</Label>
                <Input 
                  id="confidence_threshold" 
                  name="confidence_threshold" 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="1" 
                  defaultValue={editingRule?.confidence_threshold || 0.85} 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="configuration">JSON Configuration</Label>
                <Textarea 
                  id="configuration" 
                  name="configuration" 
                  rows={6}
                  defaultValue={JSON.stringify(editingRule?.configuration || {}, null, 2)} 
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
              <Button type="submit" disabled={ruleCreateMutation.isPending || ruleUpdateMutation.isPending}>
                {editingRule ? 'Save Changes' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
