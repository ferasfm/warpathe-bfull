import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getFarmDetails } from "@/lib/user-farms.functions";
import { 
  Sprout, 
  Box, 
  Activity, 
  ArrowLeft,
  LayoutGrid,
  Info,
  Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/farms/$id")({
  component: FarmDetailsPage,
});

function FarmDetailsPage() {
  const { id } = Route.useParams();

  const { data: farm, isLoading, error } = useQuery({
    queryKey: ["farm-details", id],
    queryFn: () => getFarmDetails(id),
    retry: false,
  });

  if (isLoading) {
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

  if (error || !farm) {
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
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/farms"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Link>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Update</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {new Date(farm.updated_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Automation Engine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-muted-foreground italic">
              DISCONNECTED
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6" />
            Fleet Configurations
            </h2>
            <Badge variant="secondary" className="text-[10px]">READ-ONLY</Badge>
        </div>

        {farm.fleets.length === 0 ? (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No fleets configured for this farm.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {farm.fleets.map((fleet: any) => (
              <Card key={fleet.id}>
                <CardHeader className="pb-2 border-b mb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-bold">Fleet #{fleet.fleet_number}</CardTitle>
                    <Badge variant="outline">{fleet.status}</Badge>
                  </div>
                  {fleet.name && <CardDescription>{fleet.name}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Assigned Resources</span>
                      {fleet.fleet_assignments && fleet.fleet_assignments.length > 0 ? (
                        <div className="space-y-2">
                          {fleet.fleet_assignments.map((assignment: any) => (
                            <div key={assignment.id} className="flex items-center justify-between p-2 rounded bg-accent/30 border border-accent">
                              <span className="text-sm font-medium">{assignment.resources.name}</span>
                              <code className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                {assignment.resources.code}
                              </code>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No resource assigned</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {farm.notes && (
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 italic">
                <Info className="w-4 h-4" />
                Farm Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {farm.notes}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
