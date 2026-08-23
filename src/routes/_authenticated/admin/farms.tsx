import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFarms, createFarm, updateFarm, deleteFarm, getAccounts, getFarmUsers, assignUserToFarm, removeUserFromFarm } from "@/lib/farm.functions";
import { getAllUsers } from "@/lib/auth.functions";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, Power, PowerOff, UserPlus, X } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/farms")({
  component: AdminFarmsPage,
});

function AdminFarmsPage() {
  const queryClient = useQueryClient();
  const fetchFarms = useServerFn(getFarms);
  const fetchAccounts = useServerFn(getAccounts);
  const createFarmFn = useServerFn(createFarm);
  const updateFarmFn = useServerFn(updateFarm);
  const deleteFarmFn = useServerFn(deleteFarm);
  const fetchAllUsers = useServerFn(getAllUsers);
  const fetchFarmUsers = useServerFn(getFarmUsers);
  const assignUser = useServerFn(assignUserToFarm);
  const unassignUser = useServerFn(removeUserFromFarm);

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<any>(null);
  const [viewingUsers, setViewingUsers] = useState<any>(null);

  const { data: farms, isLoading: loadingFarms } = useQuery({
    queryKey: ["admin-farms"],
    queryFn: () => fetchFarms(),
  });

  const { data: accounts } = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: () => fetchAccounts(),
  });

  const { data: allUsers } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: () => fetchAllUsers(),
  });

  const filteredFarms = useMemo(() => {
    if (!farms) return [];
    return farms.filter((farm: any) =>
      farm.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [farms, search]);

  const createMutation = useMutation({
    mutationFn: (data: any) => createFarmFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-farms"] });
      setIsCreateOpen(false);
      toast.success("Farm created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateFarmFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-farms"] });
      setEditingFarm(null);
      toast.success("Farm updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFarmFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-farms"] });
      toast.success("Farm deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  if (loadingFarms) return <div className="p-8 text-center">Loading farms...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Farms</h1>
          <p className="text-muted-foreground mt-1">Manage game farms and user assignments.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Farm
        </Button>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search farms..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farm Name</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFarms.map((farm: any) => (
                <TableRow key={farm.id}>
                  <TableCell className="font-medium">{farm.name}</TableCell>
                  <TableCell>{farm.accounts?.name || "No Account"}</TableCell>
                  <TableCell>
                    <Badge variant={farm.status === "active" ? "default" : "secondary"}>
                      {farm.status || "active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(farm.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" size="icon" 
                      onClick={() => updateMutation.mutate({ 
                        id: farm.id, 
                        status: farm.status === "active" ? "disabled" : "active" 
                      })}
                    >
                      {farm.status === "active" ? <PowerOff className="w-4 h-4 text-yellow-500" /> : <Power className="w-4 h-4 text-green-500" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setViewingUsers(farm)}>
                      <UserPlus className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingFarm(farm)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                        if (confirm("Are you sure?")) {
                            deleteMutation.mutate(farm.id);
                        }
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <FarmDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        onSubmit={(data: any) => createMutation.mutate(data)}
        accounts={accounts || []}
        title="Create New Farm"
      />

      {/* Edit Dialog */}
      {editingFarm && (
        <FarmDialog 
          open={!!editingFarm} 
          onOpenChange={() => setEditingFarm(null)}
          onSubmit={(data: any) => updateMutation.mutate({ id: editingFarm.id, ...data })}
          initialData={editingFarm}
          accounts={accounts || []}
          title="Edit Farm"
        />
      )}

      {/* User Assignment Dialog */}
      {viewingUsers && (
        <UserAssignmentDialog
          open={!!viewingUsers}
          onOpenChange={() => setViewingUsers(null)}
          farm={viewingUsers}
          allUsers={allUsers || []}
          fetchFarmUsers={fetchFarmUsers}
          assignUser={assignUser}
          unassignUser={unassignUser}
        />
      )}
    </div>
  );
}

function FarmDialog({ open, onOpenChange, onSubmit, initialData, accounts, title }: any) {
  const [name, setName] = useState(initialData?.name || "");
  const [accountId, setAccountId] = useState(initialData?.account_id || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Farm Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="account">Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc: any) => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit({ name, account_id: accountId, notes })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserAssignmentDialog({ open, onOpenChange, farm, allUsers, fetchFarmUsers, assignUser, unassignUser }: any) {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState("");

  const { data: farmUsers, isLoading } = useQuery({
    queryKey: ["farm-users", farm.id],
    queryFn: () => fetchFarmUsers({ data: { farmId: farm.id } }),
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string) => assignUser({ data: { farmId: farm.id, userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm-users", farm.id] });
      setSelectedUser("");
      toast.success("User assigned");
    },
    onError: (e) => toast.error(e.message),
  });

  const unassignMutation = useMutation({
    mutationFn: (assignmentId: string) => unassignUser({ data: { assignmentId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm-users", farm.id] });
      toast.success("User unassigned");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Users to {farm.name}</DialogTitle>
          <DialogDescription>Users assigned here can see and manage this farm.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select user to assign" />
              </SelectTrigger>
              <SelectContent>
                {allUsers
                  .filter((u: any) => !farmUsers?.some((fu: any) => fu.user_id === u.id))
                  .map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button disabled={!selectedUser} onClick={() => assignMutation.mutate(selectedUser)}>
              Assign
            </Button>
          </div>

          <div className="rounded-md border">
            {isLoading ? (
              <div className="p-4 text-center">Loading...</div>
            ) : farmUsers?.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No users assigned.</div>
            ) : (
              <div className="divide-y">
                {farmUsers?.map((assignment: any) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3">
                    <div className="text-sm">
                      <div className="font-medium">{assignment.profiles?.full_name || "No name"}</div>
                      <div className="text-muted-foreground text-xs">{assignment.profiles?.email}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => unassignMutation.mutate(assignment.id)}>
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
