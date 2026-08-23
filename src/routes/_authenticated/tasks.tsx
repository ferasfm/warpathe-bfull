import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getUserTasks } from "@/lib/user-farms.functions";
import { 
  ClipboardList, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCcw,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: UserTasksPage,
});

function UserTasksPage() {
  const [search, setSearch] = useState("");
  
  const { data: tasks, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["user-tasks"],
    queryFn: () => getUserTasks(),
  });

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'RUNNING': return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toUpperCase()) {
      case 'RUNNING': return "default";
      case 'COMPLETED': return "outline";
      case 'FAILED': return "destructive";
      default: return "secondary";
    }
  };

  const filteredTasks = tasks?.filter(t => 
    t.missionName.toLowerCase().includes(search.toLowerCase()) ||
    t.farmName.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-primary" />
            Automation Tasks
          </h1>
          <p className="text-muted-foreground">Monitor recent mission runs across your farms.</p>
        </div>

        <div className="flex items-center gap-3">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter tasks..."
                    className="pl-9 w-[250px]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button 
                variant="outline" 
                size="icon" 
                onClick={() => refetch()} 
                disabled={isRefetching}
            >
                <RefreshCcw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>

      {!filteredTasks || filteredTasks.length === 0 ? (
        <Card className="bg-muted/50 border-dashed py-20 text-center">
          <CardContent>
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">No recent tasks found.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
                Tasks will appear here once the automation engine begins processing your farm configurations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="py-4 border-b">
            <div className="grid grid-cols-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <div className="col-span-2">Task & Origin</div>
                <div>Status</div>
                <div>Started</div>
                <div className="text-right">Result</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
                {filteredTasks.map((task) => (
                    <div key={task.id} className="grid grid-cols-5 items-center p-4 hover:bg-muted/30 transition-colors">
                        <div className="col-span-2 space-y-0.5">
                            <span className="font-bold text-sm block">{task.missionName}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Sprout className="w-3 h-3" />
                                {task.farmName}
                            </span>
                        </div>
                        <div>
                            <Badge variant={getStatusVariant(task.status)} className="text-[9px] px-2 py-0">
                                <div className="flex items-center gap-1.5">
                                    {getStatusIcon(task.status)}
                                    {task.status}
                                </div>
                            </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {task.started_at ? new Date(task.started_at).toLocaleTimeString() : 'Pending'}
                        </div>
                        <div className="text-right">
                            {task.error_message ? (
                                <Badge variant="destructive" className="text-[8px] max-w-[100px] truncate" title={task.error_message}>
                                    ERROR
                                </Badge>
                            ) : task.status === 'COMPLETED' ? (
                                <Badge variant="outline" className="text-[8px] bg-green-50 text-green-700 border-green-200">
                                    SUCCESS
                                </Badge>
                            ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Sprout(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m7 2 10 10" />
            <path d="M2 22v-5c0-5.17 4.57-9.35 10-10 5.43.65 10 4.83 10 10v5" />
            <path d="M12 7v15" />
        </svg>
    )
}
