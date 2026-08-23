import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAssignedFarms } from "@/lib/user-farms.functions";
import { Sprout, Box, Activity, ChevronRight, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/farms/")({
  component: UserFarmsPage,
});

function UserFarmsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  
  const { data: farms, isLoading } = useQuery({
    queryKey: ["user-assigned-farms"],
    queryFn: () => getAssignedFarms(),
  });

  const filteredFarms = farms?.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.accountName.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">My Farms</h1>
          <p className="text-muted-foreground">Select a farm to manage its configuration.</p>
        </div>

        <div className="flex items-center gap-4">
            {farms && farms.length > 0 && (
                <Select onValueChange={(value) => navigate({ to: `/farms/${value}` })}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Quick Select Farm" />
                    </SelectTrigger>
                    <SelectContent>
                        {farms.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search farms..."
                    className="pl-9 w-[250px]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>
      </div>

      {!filteredFarms || filteredFarms.length === 0 ? (
        <Card className="bg-muted/50 border-dashed py-12 text-center">
          <CardContent>
            <Sprout className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No farms found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFarms.map((farm) => (
            <Link 
                key={farm.id} 
                to="/farms/$id" 
                params={{ id: farm.id }}
                className="block group"
            >
                <Card className="h-full hover:shadow-lg transition-all border-accent/20 group-hover:border-primary/50">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl group-hover:text-primary transition-colors">{farm.name}</CardTitle>
                                <CardDescription>{farm.accountName}</CardDescription>
                            </div>
                            <Badge variant={farm.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {farm.status || 'INACTIVE'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Fleets</span>
                                <div className="flex items-center gap-1 font-semibold">
                                    <Box className="w-3.5 h-3.5" />
                                    {farm.fleetCount}
                                </div>
                            </div>
                            <div className="space-y-1 text-right">
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Automation</span>
                                <div className="flex items-center justify-end gap-1 font-semibold text-primary">
                                    <Activity className="w-3.5 h-3.5" />
                                    {farm.automationStatus}
                                </div>
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                            <span className="text-xs font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                View Details <ChevronRight className="w-3 h-3" />
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
