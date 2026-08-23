import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMissions, createMission } from '@/lib/mission.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/missions/')({
  component: MissionsPage,
});

function MissionsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: missions, isLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: () => getMissions(),
  });

  const createMutation = useMutation({
    mutationFn: createMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast.success('تم إنشاء المهمة بنجاح');
    },
  });

  const filteredMissions = missions?.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    const name = prompt('أدخل اسم المهمة:');
    if (!name) return;
    createMutation.mutate({ data: { name, status: 'draft' } });
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة المهمات (Missions)</h1>
        <Button onClick={handleCreate} disabled={createMutation.isPending}>
          <Plus className="w-4 h-4 ml-2" />
          مهمة جديدة
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="بحث في المهمات..."
          className="pr-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الإصدار</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">جاري التحميل...</TableCell>
                </TableRow>
              ) : filteredMissions?.map((mission) => (
                <TableRow key={mission.id}>
                  <TableCell className="font-bold">{mission.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{mission.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{mission.version || '1.0.0'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={mission.status === 'active' ? 'default' : 'secondary'}>
                      {mission.status === 'active' ? 'نشط' : 'مسودة'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(mission.created_at!).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/admin/missions/$id" params={{ id: mission.id }}>
                        <Eye className="w-4 h-4 ml-2" />
                        عرض التفاصيل
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
