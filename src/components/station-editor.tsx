import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FUEL_LABELS, FUEL_ORDER, type FuelType } from "@/lib/fuel-types";
import { WEST_BANK_GOVERNORATES, REGIONS } from "@/lib/regions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, MapPin, Phone, Clock } from "lucide-react";

type Station = {
  id: string;
  name: string;
  city: string;
  region?: string | null;
  address: string | null;
  phone: string | null;
  working_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  is_active: boolean;
};

type FuelRow = {
  id: string;
  station_id: string;
  fuel_type: FuelType;
  is_available: boolean;
  expected_arrival: string | null;
  note: string | null;
};

type Perms = { can_edit_fuels: boolean; can_edit_arrival: boolean; can_edit_station_info: boolean };

export function StationEditor({
  station,
  perms,
  isSuperAdmin,
}: {
  station: Station;
  perms: Perms;
  isSuperAdmin: boolean;
}) {
  const canFuels = isSuperAdmin || perms.can_edit_fuels;
  const canArrival = isSuperAdmin || perms.can_edit_arrival;
  const canInfo = isSuperAdmin || perms.can_edit_station_info;

  const [fuels, setFuels] = useState<FuelRow[]>([]);
  const [info, setInfo] = useState(station);
  const [savingInfo, setSavingInfo] = useState(false);

  useEffect(() => setInfo(station), [station]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data, error } = await supabase.from("station_fuels").select("*").eq("station_id", station.id);
      if (error) {
        toast.error("فشل تحميل بيانات الوقود: " + error.message);
        return;
      }
      if (!mounted) return;
      const existing = (data as FuelRow[]) ?? [];
      // ensure all fuel types exist
      const missing = FUEL_ORDER.filter((ft) => !existing.some((e) => e.fuel_type === ft));
      if (missing.length > 0 && (isSuperAdmin || perms.can_edit_fuels)) {
        const { error: insertError } = await supabase.from("station_fuels").insert(
          missing.map((ft) => ({ station_id: station.id, fuel_type: ft, is_available: false })),
        );
        if (insertError) {
          toast.error("فشل تهيئة أنواع الوقود: " + insertError.message);
          return;
        }
        const { data: refetched } = await supabase.from("station_fuels").select("*").eq("station_id", station.id);
        if (mounted) setFuels((refetched as FuelRow[]) ?? []);
      } else {
        setFuels(existing);
      }
    }
    load();

    const channel = supabase
      .channel(`fuels-${station.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "station_fuels", filter: `station_id=eq.${station.id}` }, load)
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [station.id, perms.can_edit_fuels, isSuperAdmin]);

  async function updateFuel(id: string, patch: Partial<FuelRow>) {
    const { error } = await supabase.from("station_fuels").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("تم التحديث");
  }

  async function saveInfo() {
    setSavingInfo(true);
    const { error } = await supabase
      .from("stations")
      .update({
        name: info.name,
        city: info.city,
        region: info.region,
        address: info.address,
        phone: info.phone,
        working_hours: info.working_hours,
        google_maps_url: info.google_maps_url,
        latitude: info.latitude,
        longitude: info.longitude,
        ...(isSuperAdmin ? { is_active: info.is_active } : {}),
      })
      .eq("id", station.id);
    setSavingInfo(false);
    if (error) toast.error(error.message);
    else toast.success("تم حفظ معلومات المحطة");
  }

  return (
    <div className="space-y-6">
      {/* Fuels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">⛽ حالة الوقود</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fuels
            .sort((a, b) => FUEL_ORDER.indexOf(a.fuel_type) - FUEL_ORDER.indexOf(b.fuel_type))
            .map((f) => (
              <div key={f.id} className="rounded-lg border p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0">
                    <div className="font-bold">{FUEL_LABELS[f.fuel_type]}</div>
                    <div className={`text-xs ${f.is_available ? "text-success" : "text-muted-foreground"}`}>
                      {f.is_available ? "متوفر الآن" : "غير متوفر"}
                    </div>
                  </div>
                  <Switch
                    checked={f.is_available}
                    disabled={!canFuels}
                    onCheckedChange={(v) => {
                      setFuels((prev) => prev.map((x) => (x.id === f.id ? { ...x, is_available: v } : x)));
                      updateFuel(f.id, { is_available: v, ...(v ? { expected_arrival: null } : {}) });
                    }}
                  />
                </div>
                {!f.is_available && canArrival && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">وقت الوصول المتوقع</Label>
                      <Input
                        type="datetime-local"
                        value={f.expected_arrival ? new Date(f.expected_arrival).toISOString().slice(0, 16) : ""}
                        onChange={(e) => {
                          const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                          setFuels((prev) => prev.map((x) => (x.id === f.id ? { ...x, expected_arrival: val } : x)));
                          updateFuel(f.id, { expected_arrival: val });
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">ملاحظة</Label>
                      <Input
                        value={f.note ?? ""}
                        placeholder="اختياري"
                        onChange={(e) => {
                          const v = e.target.value;
                          setFuels((prev) => prev.map((x) => (x.id === f.id ? { ...x, note: v } : x)));
                        }}
                        onBlur={(e) => updateFuel(f.id, { note: e.target.value || null })}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          {!canFuels && (
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              لا تملك صلاحية تعديل توفر الوقود. راجع الأدمن الرئيسي.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Station info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">معلومات المحطة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <fieldset disabled={!canInfo} className="space-y-3">
            <div>
              <Label className="text-xs">اسم المحطة</Label>
              <Input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">المنطقة</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={info.region || ""} 
                  onChange={(e) => setInfo({ ...info, region: e.target.value })}
                >
                  <option value="">اختر المنطقة</option>
                  {REGIONS.map((r) => <option key={r.id} value={r.id.charAt(0).toUpperCase() + r.id.slice(1)}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">المحافظة</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={info.city} 
                  onChange={(e) => setInfo({ ...info, city: e.target.value })}
                >
                  <option value="">اختر المحافظة</option>
                  {WEST_BANK_GOVERNORATES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs"><Phone className="inline h-3 w-3" /> الهاتف</Label>
              <Input value={info.phone ?? ""} onChange={(e) => setInfo({ ...info, phone: e.target.value })} dir="ltr" />
            </div>
            <div>
              <Label className="text-xs"><MapPin className="inline h-3 w-3" /> العنوان</Label>
              <Textarea value={info.address ?? ""} onChange={(e) => setInfo({ ...info, address: e.target.value })} rows={2} />
            </div>
            <div>
              <Label className="text-xs"><Clock className="inline h-3 w-3" /> ساعات العمل</Label>
              <Input value={info.working_hours ?? ""} onChange={(e) => setInfo({ ...info, working_hours: e.target.value })} placeholder="مثال: 6:00 ص - 12:00 م" />
            </div>
            <div>
              <Label className="text-xs">رابط جوجل ماب</Label>
              <Input value={info.google_maps_url ?? ""} onChange={(e) => setInfo({ ...info, google_maps_url: e.target.value })} dir="ltr" placeholder="https://maps.google.com/..." />
            </div>
            {isSuperAdmin && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>المحطة نشطة (تظهر للعامة)</Label>
                </div>
                <Switch checked={info.is_active} onCheckedChange={(v) => setInfo({ ...info, is_active: v })} />
              </div>
            )}
            <Button onClick={saveInfo} disabled={savingInfo} className="w-full sm:w-auto">
              <Save className="ml-1 h-4 w-4" /> {savingInfo ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </fieldset>
          {!canInfo && (
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              لا تملك صلاحية تعديل معلومات المحطة. للعرض فقط.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
