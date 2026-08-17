import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, MapPin, Users, History, CheckCircle2, XCircle } from "lucide-react";
import { FUEL_LABELS, FUEL_ORDER, type FuelType } from "@/lib/fuel-types";
import { REGIONS } from "@/lib/regions";

export function OverviewTab() {
  const [stats, setStats] = useState({
    totalStations: 0,
    activeStations: 0,
    totalManagers: 0,
    fuelAvailability: {} as Record<FuelType, { available: number; total: number }>,
    regionalStats: {} as Record<string, { available: number; total: number }>,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, p, f, r] = await Promise.all([
        supabase.from("stations").select("id, is_active, region"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("station_fuels").select("fuel_type, is_available, station_id"),
        supabase.from("user_roles").select("user_id").eq("role", "station_manager"),
      ]);

      const stations = (s.data as { id: string; is_active: boolean; region: string | null }[]) ?? [];
      const managerIds = new Set((r.data ?? []).map((x) => x.user_id));
      
      const fuelStats = {} as Record<FuelType, { available: number; total: number }>;
      FUEL_ORDER.forEach(ft => {
        fuelStats[ft] = { available: 0, total: 0 };
      });

      const regionStats = {} as Record<string, { available: number; total: number }>;
      REGIONS.forEach(reg => {
        regionStats[reg.id.charAt(0).toUpperCase() + reg.id.slice(1)] = { available: 0, total: 0 };
      });
      regionStats["غير مصنّف"] = { available: 0, total: 0 };

      const stationRegionMap = new Map(stations.map(st => [st.id, st.region || "غير مصنّف"]));

      (f.data ?? []).forEach((row: any) => {
        const ft = row.fuel_type as FuelType;
        if (fuelStats[ft]) {
          fuelStats[ft].total++;
          if (row.is_available) fuelStats[ft].available++;
        }

        const region = stationRegionMap.get(row.station_id) || "غير مصنّف";
        if (!regionStats[region]) regionStats[region] = { available: 0, total: 0 };
        regionStats[region].total++;
        if (row.is_available) regionStats[region].available++;
      });

      setStats({
        totalStations: stations.length,
        activeStations: stations.filter(x => x.is_active).length,
        totalManagers: managerIds.size,
        fuelAvailability: fuelStats,
        regionalStats: regionStats,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">جاري تحميل البيانات...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي المحطات" value={stats.totalStations} icon={<MapPin className="h-4 w-4" />} />
        <StatCard title="المحطات النشطة" value={stats.activeStations} icon={<CheckCircle2 className="h-4 w-4" />} color="text-success" />
        <StatCard title="مديرو المحطات" value={stats.totalManagers} icon={<Users className="h-4 w-4" />} />
        <StatCard title="أنواع الوقود" value={FUEL_ORDER.length} icon={<Fuel className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">توفر الوقود في المحطات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {FUEL_ORDER.map(ft => {
              const s = stats.fuelAvailability[ft];
              const percent = s.total > 0 ? Math.round((s.available / s.total) * 100) : 0;
              return (
                <div key={ft} className="rounded-xl border p-4 text-center space-y-2">
                  <div className="text-sm font-bold text-muted-foreground">{FUEL_LABELS[ft]}</div>
                  <div className="text-2xl font-black">{percent}%</div>
                  <div className="text-[10px] text-muted-foreground">
                    متوفر في {s.available} من أصل {s.total} محطة
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">حالة الوقود حسب المناطق</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(stats.regionalStats).map(([region, s]) => {
              const regionLabel = REGIONS.find(r => (r.id.charAt(0).toUpperCase() + r.id.slice(1)) === region)?.label || region;
              const percent = s.total > 0 ? Math.round((s.available / s.total) * 100) : 0;
              return (
                <div key={region} className="rounded-xl border p-4 text-center space-y-2">
                  <div className="text-sm font-bold text-muted-foreground">{regionLabel}</div>
                  <div className="text-2xl font-black">{percent}%</div>
                  <div className="text-[10px] text-muted-foreground">
                    توفّر الوقود بنسبة {percent}% في هذه المنطقة
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
