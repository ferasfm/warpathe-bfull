import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, updateUserRole } from "@/lib/auth.functions";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRoles } from "@/hooks/use-roles";
import { Search, Filter, UserCog } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UserManagementPage,
});

function UserManagementPage() {
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(getAllUsers);
  const mutateRole = useServerFn(updateUserRole);
  const { isSuperAdmin, isAdmin } = useRoles();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: (vars: { userId: string; newRole: 'super_admin' | 'admin' | 'user' }) => 
      mutateRole({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User role updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user: any) => {
      const currentRole = user.user_roles?.[0]?.role || 'user';
      const matchesSearch = 
        user.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        user.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || currentRole === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  if (isLoading) return <div className="p-8 text-center">Loading users...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage platform users, roles, and permissions.</p>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px]">User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: any) => {
                    const currentRole = user.user_roles?.[0]?.role || 'user';
                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {(user.full_name?.[0] || 'U').toUpperCase()}
                            </div>
                            <span>{user.full_name || 'Anonymous'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <RoleBadge role={currentRole} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] uppercase font-bold px-2 py-0">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
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
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue placeholder="Change role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
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
    super_admin: "Super Admin",
    admin: "Admin",
    user: "User",
  };

  return (
    <Badge variant="outline" className={`${colors[role]} text-[10px] uppercase font-bold px-2 py-0`}>
      {labels[role] || role.toUpperCase()}
    </Badge>
  );
}
