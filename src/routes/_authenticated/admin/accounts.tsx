import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccounts, createAccount, updateAccount, deleteAccount } from "@/lib/farm.functions";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, Power, PowerOff } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/accounts")({
  component: AdminAccountsPage,
});

function AdminAccountsPage() {
  const queryClient = useQueryClient();
  const fetchAccounts = useServerFn(getAccounts);
  const createAccountFn = useServerFn(createAccount);
  const updateAccountFn = useServerFn(updateAccount);
  const deleteAccountFn = useServerFn(deleteAccount);

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: () => fetchAccounts(),
  });

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter((acc: any) =>
      acc.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [accounts, search]);

  const createMutation = useMutation({
    mutationFn: (data: any) => createAccountFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      setIsCreateOpen(false);
      toast.success("Account created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateAccountFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      setEditingAccount(null);
      toast.success("Account updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAccountFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      toast.success("Account deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-center">Loading accounts...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage game accounts and organizations.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Account
        </Button>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
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
                <TableHead>Account Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account: any) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>
                    <Badge variant={account.status === "active" ? "default" : "secondary"}>
                      {account.status || "active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(account.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" size="icon" 
                      onClick={() => updateMutation.mutate({ 
                        id: account.id, 
                        status: account.status === "active" ? "disabled" : "active" 
                      })}
                    >
                      {account.status === "active" ? <PowerOff className="w-4 h-4 text-yellow-500" /> : <Power className="w-4 h-4 text-green-500" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingAccount(account)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                        if (confirm("Are you sure? This may fail if farms depend on it.")) {
                            deleteMutation.mutate(account.id);
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
      <AccountDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        onSubmit={(data: any) => createMutation.mutate(data)}
        title="Create New Account"
      />

      {/* Edit Dialog */}
      {editingAccount && (
        <AccountDialog 
          open={!!editingAccount} 
          onOpenChange={() => setEditingAccount(null)}
          onSubmit={(data: any) => updateMutation.mutate({ id: editingAccount.id, ...data })}
          initialData={editingAccount}
          title="Edit Account"
        />
      )}
    </div>
  );
}

function AccountDialog({ open, onOpenChange, onSubmit, initialData, title }: any) {
  const [name, setName] = useState(initialData?.name || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Account Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit({ name, notes })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
