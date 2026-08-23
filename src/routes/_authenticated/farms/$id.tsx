import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFarmDetails, getActiveResources, saveFarmConfiguration } from "@/lib/user-farms.functions";
import { 
  Sprout, 
  Box, 
  Activity, 
  ArrowLeft,
  LayoutGrid,
  Info,
  Layers,
  Save,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/farms/$id")({
  component: FarmDetailsPage,
});

function FarmDetailsPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<Record<string, string>>({});

  const { data: farm, isLoading: isLoadingFarm, error: farmError } = useQuery({
    queryKey: ["farm-details", id],
    queryFn: () => getFarmDetails({ data: id }),
    retry: false,
  });

  const { data: resources, isLoading: isLoadingResources } = useQuery({
    queryKey: ["active-resources"],
    queryFn: () => getActiveResources(),
  });

  const mutation = useMutation({
    mutationFn: (data: { farmId: string, assignments: { fleetId: string, resourceId: string }[] }) => 
      saveFarmConfiguration({ data }),
    onSuccess: () => {
      toast.success("Configuration saved successfully");
      queryClient.invalidateQueries({ queryKey: ["farm-details", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save configuration");
    }
  });

  useEffect(() => {
    if (farm?.fleets) {
      const initialConfig: Record<string, string> = {};
      farm.fleets.forEach((fleet: any) => {
        if (fleet.fleet_assignments && fleet.fleet_assignments.length > 0) {
          initialConfig[fleet.id] = fleet.fleet_assignments[0].resource_id;
        }
      });
      setConfig(initialConfig);
    }
  }, [farm]);

  const handleSave = () => {
    const assignments = Object.entries(config)
      .filter(([_, resourceId]) => resourceId && resourceId !== "none")
      .map(([fleetId, resourceId]) => ({
        fleetId,
        resourceId
      }));

    if (assignments.length === 0) {
      toast.warning("Please configure at least one fleet");
      return;
    }

    mutation.mutate({
      farmId: id,
      assignments
    });
  };

  const handleResourceChange = (fleetId: string, resourceId: string) => {
    setConfig(prev => ({
      ...prev,
      [fleetId]: resourceId
    }));
  };

  if (isLoadingFarm) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (farmError || !farm) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-4 text-center">
        <Alert variant="destructive">
          <LayoutGrid className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This farm could not be found or you do not have permission to view it.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to="/farms"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Farms</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/farms"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Link>
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={mutation.isPending}
          className="font-bold px-8"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Configuration
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black tracking-tighter">{farm.name}</h1>
            <Badge variant={farm.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {farm.status || 'INACTIVE'}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4" />
            Part of <strong>{farm.accountName}</strong> account
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-4 py-1 text-sm font-bold bg-primary/5 text-primary border-primary/20">
            <Activity className="w-4 h-4 mr-2" />
            {farm.automationStatus}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Fleets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Box className="w-6 h-6 text-primary" />
              {farm.fleets.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${farm.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              {farm.status || 'INACTIVE'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Automation Engine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-muted-foreground italic">
              IDLE
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6" />
            Fleet Configuration
            </h2>
            <Badge variant="secondary" className="text-[10px]">EDITABLE</Badge>
        </div>

        {farm.fleets.length === 0 ? (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No fleets configured for this farm by administrators.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {farm.fleets.map((fleet: any) => (
              <Card key={fleet.id} className="border-l-4 border-l-primary/40">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-black tracking-tight">FLEET #{fleet.fleet_number}</CardTitle>
                    <Badge variant="outline" className="text-[9px] uppercase">{fleet.status}</Badge>
                  </div>
                  {fleet.name && <CardDescription className="text-xs truncate">{fleet.name}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Resource</label>
                    <Select 
                      value={config[fleet.id] || "none"} 
                      onValueChange={(val) => handleResourceChange(fleet.id, val)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select resource" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Assigned</SelectItem>
                        {resources?.map(res => (
                          <SelectItem key={res.id} value={res.id}>{res.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {config[fleet.id] && config[fleet.id] !== "none" && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary animate-in fade-in zoom-in-95 duration-200">
                      <Activity className="w-3 h-3" />
                      READY TO DEPLOY
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {farm.notes && (
        <Card className="bg-muted/30 border-dashed">
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <Info className="w-3.5 h-3.5" />
                Special Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {farm.notes}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
