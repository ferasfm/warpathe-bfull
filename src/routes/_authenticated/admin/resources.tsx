import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getResources } from '@/lib/resource.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/resources')({
  component: ResourcesPage,
});

function ResourcesPage() {
  const { data: resources, isLoading, refetch } = useQuery({
    queryKey: ['resources'],
    queryFn: () => getResources(),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة الموارد</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الموارد</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المورد</TableHead>
                <TableHead>الرمز</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الصورة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources?.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">{resource.name}</TableCell>
                  <TableCell>{resource.code}</TableCell>
                  <TableCell>
                    <Badge variant={resource.status === 'active' ? 'default' : 'secondary'}>
                      {resource.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {resource.resource_assets?.[0]?.storage_path ? (
                        <img 
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/resource-assets/${resource.resource_assets[0].storage_path}`} 
                            alt={resource.name}
                            className="w-10 h-10 object-cover rounded"
                        />
                    ) : 'لا توجد صورة'}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 ml-2" />
                        تحديث الصورة
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
