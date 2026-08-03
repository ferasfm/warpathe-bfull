import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useRoles } from "@/lib/auth-hooks";
import { StationEditor } from "@/components/station-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, LogOut, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/manager")({
  head: () => ({
    meta: [
      { title: "لوحة مدير المحطة — شركة الهدى" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManagerPage,
});

type StationRow = {
  id: string;
  name: string;
  city: string;
  region: string | null;
  address: string | null;
  phone: string | null;
  working_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  is_active: boolean;
};

type Perms = { can_edit_fuels: boolean; can_edit_arrival: boolean; can_edit_station_info: boolean };
type StationWithPerms = { station: StationRow; perms: Perms };

function ManagerPage() {
  const nav = useNavigate();
  const { user, loading } = useSession();
  const { roles, loading: rolesLoading, isSuperAdmin } = useRoles(user?.id);
  const [items, setItems] = useState<StationWithPerms[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading || rolesLoading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    if (isSuperAdmin) { nav({ to: "/admin" }); return; }
    if (roles.length === 0) return;

    (async () => {
      // 1) Get groups I belong to
      const { data: mem } = await supabase
        .from("manager_group_members")
        .select("group_id")
        .eq("user_id", user.id);
      const groupIds = (mem ?? []).map((m) => m.group_id);
      if (groupIds.length === 0) {
        setItems([]);
        setDataLoading(false);
        return;
      }
      // 2) Get groups + their stations
      const [{ data: groups }, { data: gs }] = await Promise.all([
        supabase.from("manager_groups").select("*").in("id", groupIds),
        supabase.from("manager_group_stations").select("group_id, station_id").in("group_id", groupIds),
      ]);
      const stationIds = Array.from(new Set((gs ?? []).map((x) => x.station_id)));
      const { data: sts } = await supabase.from("stations").select("*").in("id", stationIds);

      // 3) Compute effective perms per station (OR across groups)
      const byStation = new Map<string, Perms>();
      (gs ?? []).forEach((row) => {
        const g = groups?.find((x) => x.id === row.group_id);
        if (!g) return;
        const cur = byStation.get(row.station_id) ?? { can_edit_fuels: false, can_edit_arrival: false, can_edit_station_info: false };
        byStation.set(row.station_id, {
          can_edit_fuels: cur.can_edit_fuels || g.can_edit_fuels,
          can_edit_arrival: cur.can_edit_arrival || g.can_edit_arrival,
          can_edit_station_info: cur.can_edit_station_info || g.can_edit_station_info,
        });
      });

      const result: StationWithPerms[] = ((sts as StationRow[]) ?? [])
        .map((st) => ({ station: st, perms: byStation.get(st.id)! }))
        .filter((x) => x.perms);
      setItems(result);
      if (result[0]) setSelectedId(result[0].station.id);
      setDataLoading(false);
    })();
  }, [user, loading, rolesLoading, isSuperAdmin, roles, nav]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    nav({ to: "/auth" });
  }

  if (loading || rolesLoading || dataLoading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground" dir="rtl">جاري التحميل...</div>;
  }

  const selected = items.find((a) => a.station.id === selectedId);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm hover:text-primary">
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary">
              <Fuel className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-bold">لوحة مدير المحطة</div>
              <div className="text-[11px] opacity-70">{user?.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              لم يتم تعيينك في أي مجموعة بعد. تواصل مع الأدمن الرئيسي.
            </CardContent>
          </Card>
        ) : (
          <>
            {items.length > 1 && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-sm">محطاتك ({items.length})</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {items.map((a) => (
                    <button
                      key={a.station.id}
                      onClick={() => setSelectedId(a.station.id)}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        selectedId === a.station.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
                      }`}
                    >
                      {a.station.name}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {selected && (
              <StationEditor
                station={selected.station}
                perms={selected.perms}
                isSuperAdmin={false}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
