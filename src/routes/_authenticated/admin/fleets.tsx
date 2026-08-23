import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFleetsByFarm, createOrUpdateFleet, assignResourceToFleet, deleteFleet } from '@/lib/fleet.functions';
import { getFarms } from '@/lib/farm.functions';
import { getResources } from '@/lib/resource.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/fleets')({
  component: FleetsPage,
});

function FleetsPage() {
  const queryClient = useQueryClient();
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [newFleetNumber, setNewFleetNumber] = useState('');

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => getFarms(),
  });

  const { data: resources } = useQuery({
    queryKey: ['resources'],
    queryFn: () => getResources(),
  });

  const { data: fleets, isLoading: fleetsLoading } = useQuery({
    queryKey: ['fleets', selectedFarmId],
    queryFn: () => getFleetsByFarm({ data: { farmId: selectedFarmId } }),
    enabled: !!selectedFarmId,
  });

  const createFleetMutation = useMutation({
    mutationFn: createOrUpdateFleet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleets', selectedFarmId] });
      setNewFleetNumber('');
      toast.success('تمت إضافة الأسطول بنجاح');
    },
    onError: (error: any) => {
        toast.error(error.message);
    }
  });

  const assignResourceMutation = useMutation({
    mutationFn: assignResourceToFleet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleets', selectedFarmId] });
      toast.success('تم تحديث المورد بنجاح');
    },
  });

  const deleteFleetMutation = useMutation({
    mutationFn: deleteFleet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleets', selectedFarmId] });
      toast.success('تم حذف الأسطول');
    },
  });

  const handleAddFleet = () => {
    if (!selectedFarmId || !newFleetNumber) return;
    createFleetMutation.mutate({
      data: {
        farm_id: selectedFarmId,
        fleet_number: parseInt(newFleetNumber),
        status: 'active'
      }
    });
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold">إدارة الأساطيل والتخصيصات</h1>

      <Card>
        <CardHeader>
          <CardTitle>اختر المزرعة</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedFarmId} value={selectedFarmId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="اختر مزرعة..." />
            </SelectTrigger>
            <SelectContent>
              {farms?.map((farm) => (
                <SelectItem key={farm.id} value={farm.id}>
                  {farm.name} ({farm.accounts?.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedFarmId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>أساطيل المزرعة</CardTitle>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="رقم الأسطول"
                value={newFleetNumber}
                onChange={(e) => setNewFleetNumber(e.target.value)}
                className="w-32"
              />
              <Button onClick={handleAddFleet} disabled={createFleetMutation.isPending}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة أسطول
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {fleetsLoading ? (
              <div>جاري التحميل...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الأسطول</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>المورد المخصص</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fleets?.map((fleet) => (
                    <TableRow key={fleet.id}>
                      <TableCell className="font-bold text-lg">Fleet {fleet.fleet_number}</TableCell>
                      <TableCell>{fleet.name || '-'}</TableCell>
                      <TableCell>
                        <Select
                          value={fleet.fleet_assignments?.[0]?.resource_id || ''}
                          onValueChange={(val) => assignResourceMutation.mutate({
                            data: {
                              fleetId: fleet.id,
                              farmId: selectedFarmId,
                              resourceId: val
                            }
                          })}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="اختر مورداً..." />
                          </SelectTrigger>
                          <SelectContent>
                            {resources?.map((res) => (
                              <SelectItem key={res.id} value={res.id}>
                                {res.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا الأسطول؟')) {
                                deleteFleetMutation.mutate({ data: { id: fleet.id } });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {fleets?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        لا توجد أساطيل لهذه المزرعة. ابدأ بإضافة واحد!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
