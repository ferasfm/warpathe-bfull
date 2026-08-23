import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, updateUserRole } from "@/lib/auth.functions";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRoles } from "@/hooks/use-roles";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UserManagementPage,
});

function UserManagementPage() {
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(getAllUsers);
  const mutateRole = useServerFn(updateUserRole);
  const { isSuperAdmin } = useRoles();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: (vars: { userId: string; newRole: 'super_admin' | 'admin' | 'user' }) => 
      mutateRole({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("تم تحديث الصلاحيات بنجاح");
    },
    onError: (error: any) => {
      toast.error("فشل التحديث: " + error.message);
    },
  });

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-black tracking-tight">إدارة المستخدمين</h1>
        <p className="text-muted-foreground mt-1">عرض وتعديل صلاحيات الوصول للفريق</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الفريق</CardTitle>
          <CardDescription>إجمالي {users?.length || 0} مستخدم</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المستخدم</TableHead>
                <TableHead className="text-right">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">الصلاحية الحالية</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user: any) => {
                const currentRole = user.user_roles?.[0]?.role || 'user';
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || 'بدون اسم'}</TableCell>
                    <TableCell dir="ltr" className="text-right">{user.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={currentRole} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          defaultValue={currentRole}
                          onValueChange={(val) => 
                            updateRoleMutation.mutate({ 
                              userId: user.id, 
                              newRole: val as any 
                            })
                          }
                          disabled={
                            updateRoleMutation.isPending || 
                            (!isSuperAdmin && currentRole === 'super_admin')
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="تغيير الصلاحية" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">USER</SelectItem>
                            <SelectItem value="admin">ADMIN</SelectItem>
                            {isSuperAdmin && <SelectItem value="super_admin">SUPER_ADMIN</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    super_admin: "bg-red-500/10 text-red-500 border-red-500/20",
    admin: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    user: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  };

  const labels: Record<string, string> = {
    super_admin: "SUPER ADMIN",
    admin: "ADMIN",
    user: "USER",
  };

  return (
    <Badge variant="outline" className={colors[role]}>
      {labels[role] || role.toUpperCase()}
    </Badge>
  );
}
