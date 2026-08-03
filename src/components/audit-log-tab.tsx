import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MapPin, Fuel as FuelIcon } from "lucide-react";
import { FUEL_LABELS, type FuelType } from "@/lib/fuel-types";

type LogRow = {
  id: string;
  station_id: string | null;
  actor_email: string | null;
  entity: string;
  action: string;
  fuel_type: FuelType | null;
  summary: string;
  changes: Record<string, [unknown, unknown]> | null;
  created_at: string;
};

type StationLite = { id: string; name: string; city: string };

const FIELD_LABELS: Record<string, string> = {
  name: "الاسم",
  city: "المدينة",
  address: "العنوان",
  phone: "الهاتف",
  working_hours: "ساعات العمل",
  is_active: "التفعيل",
  is_available: "التوفر",
  expected_arrival: "الوصول المتوقع",
  note: "ملاحظة",
};

function fmtVal(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "نعم" : "لا";
  return String(v);
}

export function AuditLogTab() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [stations, setStations] = useState<Record<string, StationLite>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [stationFilter, setStationFilter] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [l, s] = await Promise.all([
        supabase
          .from("station_audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(300),
        supabase.from("stations").select("id, name, city"),
      ]);
      if (!mounted) return;
      setLogs((l.data as LogRow[]) ?? []);
      const map: Record<string, StationLite> = {};
      ((s.data as StationLite[]) ?? []).forEach((x) => (map[x.id] = x));
      setStations(map);
      setLoading(false);
    }
    load();

    const ch = supabase
      .channel("audit-log-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "station_audit_log" }, () => load())
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  const filtered = logs.filter((r) => {
    if (stationFilter !== "all" && r.station_id !== stationFilter) return false;
    if (q.trim()) {
      const hay = `${r.summary} ${r.actor_email ?? ""} ${stations[r.station_id ?? ""]?.name ?? ""}`;
      if (!hay.includes(q.trim())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="ابحث في السجل..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="text-right"
          />
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="all">كل المحطات</option>
            {Object.values(stations)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.city}
                </option>
              ))}
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">لا توجد سجلات.</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const station = r.station_id ? stations[r.station_id] : null;
            const isFuel = r.entity === "station_fuels";
            return (
              <Card key={r.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant={isFuel ? "default" : "secondary"} className="gap-1">
                        {isFuel ? <FuelIcon className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                        {isFuel ? "وقود" : "محطة"}
                      </Badge>
                      <Badge variant="outline">
                        {r.action === "insert" ? "إضافة" : r.action === "update" ? "تعديل" : "حذف"}
                      </Badge>
                      {station && (
                        <span className="text-sm font-semibold">
                          {station.name} <span className="text-muted-foreground">— {station.city}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-foreground">{r.summary}</div>
                    {r.changes && Object.keys(r.changes).length > 0 && (
                      <div className="mt-2 grid gap-1 text-xs">
                        {Object.entries(r.changes).map(([field, [oldV, newV]]) => (
                          <div key={field} className="flex flex-wrap items-center gap-1.5 rounded bg-muted/50 px-2 py-1">
                            <span className="font-semibold text-muted-foreground">
                              {FIELD_LABELS[field] ?? field}:
                            </span>
                            <span className="text-destructive line-through">{fmtVal(oldV)}</span>
                            <span className="text-muted-foreground">←</span>
                            <span className="text-success">{fmtVal(newV)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {r.fuel_type && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        النوع: {FUEL_LABELS[r.fuel_type]}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span dir="ltr">{r.actor_email ?? "نظام"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(r.created_at).toLocaleString("ar", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
