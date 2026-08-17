import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { useSession, useRoles } from "@/lib/auth-hooks";
import { createManagerUser, bootstrapFirstAdmin } from "@/lib/admin.functions";
import { searchGoogleMapsPlaces, resolveGoogleMapsUrl, type PlaceResult } from "@/lib/maps.functions";
import { WEST_BANK_GOVERNORATES, REGIONS } from "@/lib/regions";
import { StationEditor } from "@/components/station-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Fuel, LogOut, Plus, Trash2, ArrowRight, Shield, MapPin, Users, Search, Link2, Loader2, Megaphone, History } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AuditLogTab } from "@/components/audit-log-tab";
import { OverviewTab } from "@/components/overview-tab";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة الرئيسية — شركة الهدى" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Station = {
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

type Manager = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type ManagerGroup = {
  id: string;
  name: string;
  description: string | null;
  can_edit_fuels: boolean;
  can_edit_arrival: boolean;
  can_edit_station_info: boolean;
};


function AdminPage() {
  const nav = useNavigate();
  const { user, loading } = useSession();
  const { isSuperAdmin, loading: rolesLoading } = useRoles(user?.id);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);

  useEffect(() => {
    supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "super_admin")
      .then(({ count }) => {
        setNeedsBootstrap((count ?? 0) === 0);
        setCheckingBootstrap(false);
      });
  }, []);

  useEffect(() => {
    if (loading || rolesLoading || checkingBootstrap) return;
    if (needsBootstrap) return;
    if (!user) nav({ to: "/auth" });
    else if (!isSuperAdmin) nav({ to: "/manager" });
  }, [user, loading, rolesLoading, isSuperAdmin, needsBootstrap, checkingBootstrap, nav]);

  if (checkingBootstrap || loading || rolesLoading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground" dir="rtl">جاري التحميل...</div>;
  }

  if (needsBootstrap) return <BootstrapForm onDone={() => setNeedsBootstrap(false)} />;

  if (!user || !isSuperAdmin) return null;

  return <AdminDashboard email={user.email ?? ""} />;
}

function BootstrapForm({ onDone }: { onDone: () => void }) {
  const bootstrap = useServerFn(bootstrapFirstAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await bootstrap({ data: { email, password, full_name: fullName } });
      toast.success("تم إنشاء الأدمن الرئيسي! يرجى تسجيل الدخول.");
      onDone();
      window.location.href = "/auth";
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-secondary px-4" dir="rtl">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle>إعداد الأدمن الرئيسي</CardTitle>
          <CardDescription>أنشئ أول حساب إدارة رئيسية. هذه الخطوة تجرى مرة واحدة فقط.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>الاسم الكامل</Label>
              <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
            </div>
            <div>
              <Label>كلمة المرور</Label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
            </div>
            <Button className="w-full" disabled={busy}>{busy ? "..." : "إنشاء الحساب"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard({ email }: { email: string }) {
  const nav = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    nav({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b bg-secondary text-secondary-foreground">
        <div className="mx-auto grid max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <Link to="/"><ArrowRight className="h-4 w-4" /></Link>
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">لوحة الإدارة الرئيسية</div>
              <div className="truncate text-[11px] opacity-70">{email}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview"><Search className="ml-1 h-4 w-4" /> نظرة عامة</TabsTrigger>
            <TabsTrigger value="stations"><MapPin className="ml-1 h-4 w-4" /> المحطات</TabsTrigger>
            <TabsTrigger value="managers"><Users className="ml-1 h-4 w-4" /> المديرون</TabsTrigger>
            <TabsTrigger value="groups"><Shield className="ml-1 h-4 w-4" /> المجموعات</TabsTrigger>
            <TabsTrigger value="edit"><Fuel className="ml-1 h-4 w-4" /> تعديل محطة</TabsTrigger>
            <TabsTrigger value="news"><Megaphone className="ml-1 h-4 w-4" /> الأخبار</TabsTrigger>
            <TabsTrigger value="audit"><History className="ml-1 h-4 w-4" /> السجل</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>

          <TabsContent value="stations" className="mt-4"><StationsTab /></TabsContent>
          <TabsContent value="managers" className="mt-4"><ManagersTab /></TabsContent>
          <TabsContent value="groups" className="mt-4"><GroupsTab /></TabsContent>
          <TabsContent value="edit" className="mt-4"><EditStationTab /></TabsContent>
          <TabsContent value="news" className="mt-4"><NewsTab /></TabsContent>
          <TabsContent value="audit" className="mt-4"><AuditLogTab /></TabsContent>
        </Tabs>


      </main>
    </div>
  );
}

function StationsTab() {
  const searchFn = useServerFn(searchGoogleMapsPlaces);
  const resolveFn = useServerFn(resolveGoogleMapsUrl);
  const [stations, setStations] = useState<Station[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const empty: Station = { id: "", name: "", city: "", region: "", address: "", phone: "", working_hours: "", latitude: null, longitude: null, google_maps_url: "", is_active: true };
  const [form, setForm] = useState<Station>(empty);
  const [regionFilter, setRegionFilter] = useState<string>("all");

  // Google Maps import state
  const [importMode, setImportMode] = useState<"search" | "url" | null>(null);
  const [searchQ, setSearchQ] = useState("محطة وقود الهدى");
  const [searchRegion, setSearchRegion] = useState<string>("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [pasteUrl, setPasteUrl] = useState("");

  async function load() {
    const { data } = await supabase.from("stations").select("*").order("region").order("city");
    setStations((data as Station[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  function applyPlace(p: PlaceResult) {
    setForm((f) => ({
      ...f,
      name: p.name || f.name,
      address: p.address || f.address,
      latitude: p.latitude ?? f.latitude,
      longitude: p.longitude ?? f.longitude,
      google_maps_url: p.google_maps_url || f.google_maps_url,
      city: f.city || (p.address?.split("،")[0] ?? ""),
    }));
    setImportMode(null);
    setResults([]);
    toast.success("تم استيراد البيانات من جوجل ماب");
  }

  async function runSearch() {
    setSearchBusy(true);
    setResults([]);
    try {
      const res = await searchFn({ data: { query: searchQ, region: searchRegion || form.region || undefined } });
      setResults(res);
      if (res.length === 0) toast.info("لا توجد نتائج");
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setSearchBusy(false); }
  }

  async function runResolveUrl() {
    if (!pasteUrl) return;
    setSearchBusy(true);
    try {
      const p = await resolveFn({ data: { url: pasteUrl } });
      applyPlace(p);
      setPasteUrl("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setSearchBusy(false); }
  }

  async function save() {
    setBusy(true);
    const { id, ...rest } = form;
    const payload = {
      name: rest.name,
      city: rest.city,
      region: rest.region || null,
      address: rest.address,
      phone: rest.phone,
      working_hours: rest.working_hours,
      latitude: rest.latitude,
      longitude: rest.longitude,
      google_maps_url: rest.google_maps_url,
      is_active: rest.is_active,
    };
    const { error } = id
      ? await supabase.from("stations").update(payload).eq("id", id)
      : await supabase.from("stations").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    setOpen(false);
    setForm(empty);
    load();
  }

  async function del(id: string) {
    if (!confirm("حذف المحطة نهائياً؟")) return;
    const { error } = await supabase.from("stations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  }

  const shown = regionFilter === "all" ? stations : stations.filter((s) => (s.region || "") === regionFilter);
  const byRegion = new Map<string, Station[]>();
  shown.forEach((s) => {
    const key = s.region || "غير مصنّف";
    if (!byRegion.has(key)) byRegion.set(key, []);
    byRegion.get(key)!.push(s);
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">المحطات ({stations.length})</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setImportMode(null); setResults([]); } }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setForm(empty)}><Plus className="ml-1 h-4 w-4" /> إضافة</Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "تعديل" : "محطة جديدة"}</DialogTitle></DialogHeader>

            {!form.id && (
              <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-3">
                <div className="mb-2 text-xs font-semibold text-primary">استيراد من Google Maps</div>
                <div className="mb-2 flex gap-2">
                  <Button type="button" size="sm" variant={importMode === "search" ? "default" : "outline"} className="flex-1" onClick={() => setImportMode(importMode === "search" ? null : "search")}>
                    <Search className="ml-1 h-3.5 w-3.5" /> بحث
                  </Button>
                  <Button type="button" size="sm" variant={importMode === "url" ? "default" : "outline"} className="flex-1" onClick={() => setImportMode(importMode === "url" ? null : "url")}>
                    <Link2 className="ml-1 h-3.5 w-3.5" /> لصق رابط
                  </Button>
                </div>

                {importMode === "search" && (
                  <div className="space-y-2">
                    <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="اسم المحطة" />
                    <Select value={searchRegion || "any"} onValueChange={(v) => setSearchRegion(v === "any" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="المحافظة (اختياري)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">كل المحافظات</SelectItem>
                        {WEST_BANK_GOVERNORATES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button type="button" size="sm" onClick={runSearch} disabled={searchBusy || !searchQ} className="w-full">
                      {searchBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "بحث في Google Maps"}
                    </Button>
                    {results.length > 0 && (
                      <div className="max-h-56 space-y-1.5 overflow-y-auto">
                        {results.map((p) => (
                          <button key={p.place_id} type="button" onClick={() => applyPlace(p)} className="w-full rounded-lg border bg-background p-2 text-right text-xs hover:border-primary hover:bg-primary/5">
                            <div className="font-semibold">{p.name}</div>
                            <div className="mt-0.5 truncate text-muted-foreground">{p.address}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {importMode === "url" && (
                  <div className="space-y-2">
                    <Input dir="ltr" value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)} placeholder="https://maps.app.goo.gl/... أو https://www.google.com/maps/..." />
                    <Button type="button" size="sm" onClick={runResolveUrl} disabled={searchBusy || !pasteUrl} className="w-full">
                      {searchBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "استخراج البيانات"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div><Label>الاسم</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label>المنطقة (وسط، شمال، جنوب)</Label>
                  <Select value={form.region || ""} onValueChange={(v) => setForm({ ...form, region: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر المنطقة" /></SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => <SelectItem key={r.id} value={r.id.charAt(0).toUpperCase() + r.id.slice(1)}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المحافظة</Label>
                  <Select value={form.city || ""} onValueChange={(v) => setForm({ ...form, city: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                    <SelectContent>
                      {WEST_BANK_GOVERNORATES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>الهاتف</Label><Input dir="ltr" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>العنوان</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>ساعات العمل</Label><Input value={form.working_hours ?? ""} onChange={(e) => setForm({ ...form, working_hours: e.target.value })} /></div>
              <div><Label>رابط جوجل ماب</Label><Input dir="ltr" value={form.google_maps_url ?? ""} onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })} placeholder="https://maps.google.com/..." /></div>
              {(form.latitude !== null || form.longitude !== null) && (
                <div className="text-xs text-muted-foreground">الإحداثيات: {form.latitude?.toFixed(5)}, {form.longitude?.toFixed(5)}</div>
              )}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>نشطة (تظهر للعامة)</Label>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
              <Button onClick={save} disabled={busy || !form.name || !form.city} className="w-full">{busy ? "..." : "حفظ"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المحافظات</SelectItem>
            {WEST_BANK_GOVERNORATES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>

        {[...byRegion.entries()].map(([region, list]) => (
          <div key={region} className="space-y-2">
            <div className="flex items-center gap-2 pt-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-bold">{region}</span>
              <span className="text-xs text-muted-foreground">({list.length})</span>
            </div>
            {list.map((s) => (
              <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{s.name}</span>
                    {!s.is_active && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">مخفية</span>}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{s.city}{s.address ? ` — ${s.address}` : ""}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => { setForm(s); setOpen(true); }}>تعديل</Button>
                  <Button variant="ghost" size="sm" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        ))}
        {shown.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">لا توجد محطات.</p>}
      </CardContent>
    </Card>
  );
}

function ManagersTab() {
  const createFn = useServerFn(createManagerUser);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [memberships, setMemberships] = useState<{ user_id: string; group_id: string }[]>([]);
  const [groups, setGroups] = useState<ManagerGroup[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [nm, setNm] = useState({ email: "", password: "", full_name: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    const [m, mem, g, roles] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name"),
      supabase.from("manager_group_members").select("user_id, group_id"),
      supabase.from("manager_groups").select("*"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const managerIds = new Set((roles.data ?? []).filter((r) => r.role === "station_manager").map((r) => r.user_id));
    const superIds = new Set((roles.data ?? []).filter((r) => r.role === "super_admin").map((r) => r.user_id));
    setManagers(((m.data ?? []) as Manager[]).filter((p) => managerIds.has(p.id) && !superIds.has(p.id)));
    setMemberships(mem.data ?? []);
    setGroups((g.data as ManagerGroup[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    setBusy(true);
    try {
      await createFn({ data: nm });
      toast.success("تم إنشاء المدير");
      setOpenNew(false);
      setNm({ email: "", password: "", full_name: "" });
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  }

  async function deleteManager(id: string) {
    if (!confirm("حذف المدير سيزيل عضويته من جميع المجموعات. متابعة؟")) return;
    await supabase.from("manager_group_members").delete().eq("user_id", id);
    await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "station_manager");
    toast.success("تمت الإزالة");
    load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">مديرو المحطات ({managers.length})</CardTitle>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild><Button size="sm"><Plus className="ml-1 h-4 w-4" /> مدير جديد</Button></DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>إنشاء حساب مدير محطة</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>الاسم الكامل</Label><Input value={nm.full_name} onChange={(e) => setNm({ ...nm, full_name: e.target.value })} /></div>
                <div><Label>البريد الإلكتروني</Label><Input dir="ltr" type="email" value={nm.email} onChange={(e) => setNm({ ...nm, email: e.target.value })} /></div>
                <div><Label>كلمة المرور (6+ أحرف)</Label><Input dir="ltr" type="text" value={nm.password} onChange={(e) => setNm({ ...nm, password: e.target.value })} /></div>
                <Button onClick={create} disabled={busy || !nm.email || nm.password.length < 6 || !nm.full_name} className="w-full">{busy ? "..." : "إنشاء"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-2">
          {managers.map((m) => {
            const myGroups = memberships.filter((x) => x.user_id === m.id).map((x) => groups.find((g) => g.id === x.group_id)?.name).filter(Boolean);
            return (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{m.full_name || m.email}</div>
                  <div className="truncate text-xs text-muted-foreground" dir="ltr">{m.email}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {myGroups.length === 0
                      ? <span className="text-xs text-muted-foreground">لا مجموعات</span>
                      : myGroups.map((n) => <span key={n} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">{n}</span>)}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteManager(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            );
          })}
          {managers.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">لا يوجد مديرون بعد. أنشئ حساباً ثم أضفه إلى مجموعة من تبويب "المجموعات".</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function GroupsTab() {
  const [groups, setGroups] = useState<ManagerGroup[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [groupStations, setGroupStations] = useState<{ id: string; group_id: string; station_id: string }[]>([]);
  const [groupMembers, setGroupMembers] = useState<{ id: string; group_id: string; user_id: string }[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [ng, setNg] = useState({ name: "", description: "", can_edit_fuels: true, can_edit_arrival: true, can_edit_station_info: false });
  const [addStationFor, setAddStationFor] = useState<string | null>(null);
  const [addMemberFor, setAddMemberFor] = useState<string | null>(null);
  const [pickStation, setPickStation] = useState("");
  const [pickMember, setPickMember] = useState("");

  async function load() {
    const [g, s, gs, gm, roles, p] = await Promise.all([
      supabase.from("manager_groups").select("*").order("name"),
      supabase.from("stations").select("*").order("city"),
      supabase.from("manager_group_stations").select("*"),
      supabase.from("manager_group_members").select("*"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("profiles").select("id, email, full_name"),
    ]);
    const managerIds = new Set((roles.data ?? []).filter((r) => r.role === "station_manager").map((r) => r.user_id));
    const superIds = new Set((roles.data ?? []).filter((r) => r.role === "super_admin").map((r) => r.user_id));
    setGroups((g.data as ManagerGroup[]) ?? []);
    setStations((s.data as Station[]) ?? []);
    setGroupStations(gs.data ?? []);
    setGroupMembers(gm.data ?? []);
    setManagers(((p.data ?? []) as Manager[]).filter((x) => managerIds.has(x.id) && !superIds.has(x.id)));
  }
  useEffect(() => { load(); }, []);

  async function createGroup() {
    if (!ng.name.trim()) return toast.error("أدخل اسم المجموعة");
    const { error } = await supabase.from("manager_groups").insert({ ...ng, name: ng.name.trim(), description: ng.description.trim() || null });
    if (error) return toast.error(error.message);
    setOpenNew(false);
    setNg({ name: "", description: "", can_edit_fuels: true, can_edit_arrival: true, can_edit_station_info: false });
    toast.success("تم إنشاء المجموعة");
    load();
  }

  async function updateGroup(id: string, patch: Partial<ManagerGroup>) {
    const { error } = await supabase.from("manager_groups").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  async function deleteGroup(id: string) {
    if (!confirm("حذف المجموعة وإزالة جميع أعضائها ومحطاتها؟")) return;
    const { error } = await supabase.from("manager_groups").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  async function addStation(groupId: string) {
    if (!pickStation) return;
    const { error } = await supabase.from("manager_group_stations").insert({ group_id: groupId, station_id: pickStation });
    if (error) return toast.error(error.message);
    setPickStation("");
    setAddStationFor(null);
    load();
  }
  async function removeStation(id: string) {
    await supabase.from("manager_group_stations").delete().eq("id", id);
    load();
  }
  async function addMember(groupId: string) {
    if (!pickMember) return;
    const { error } = await supabase.from("manager_group_members").insert({ group_id: groupId, user_id: pickMember });
    if (error) return toast.error(error.message);
    setPickMember("");
    setAddMemberFor(null);
    load();
  }
  async function removeMember(id: string) {
    await supabase.from("manager_group_members").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">مجموعات المديرين ({groups.length})</CardTitle>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild><Button size="sm"><Plus className="ml-1 h-4 w-4" /> مجموعة جديدة</Button></DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>إنشاء مجموعة صلاحيات</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>اسم المجموعة</Label><Input value={ng.name} onChange={(e) => setNg({ ...ng, name: e.target.value })} placeholder="مثلاً: فريق رام الله" /></div>
                <div><Label>وصف (اختياري)</Label><Input value={ng.description} onChange={(e) => setNg({ ...ng, description: e.target.value })} /></div>
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="text-sm font-semibold">الصلاحيات</div>
                  <PermToggle label="تعديل توفر الوقود" checked={ng.can_edit_fuels} onChange={(v) => setNg({ ...ng, can_edit_fuels: v })} />
                  <PermToggle label="تحديد وقت الوصول المتوقع" checked={ng.can_edit_arrival} onChange={(v) => setNg({ ...ng, can_edit_arrival: v })} />
                  <PermToggle label="تعديل معلومات المحطة" checked={ng.can_edit_station_info} onChange={(v) => setNg({ ...ng, can_edit_station_info: v })} />
                </div>
                <Button onClick={createGroup} className="w-full">إنشاء</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {groups.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">لا توجد مجموعات. أنشئ مجموعة، حدّد صلاحياتها، ثم أضف إليها محطات ومديرين.</CardContent></Card>
      )}

      {groups.map((g) => {
        const gStations = groupStations.filter((x) => x.group_id === g.id);
        const gMembers = groupMembers.filter((x) => x.group_id === g.id);
        return (
          <Card key={g.id} className="border-2">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-base">{g.name}</CardTitle>
                {g.description && <CardDescription className="mt-1">{g.description}</CardDescription>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteGroup(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-2 text-xs font-bold text-muted-foreground">الصلاحيات</div>
                <div className="space-y-1.5">
                  <PermToggle small label="تعديل توفر الوقود" checked={g.can_edit_fuels} onChange={(v) => updateGroup(g.id, { can_edit_fuels: v })} />
                  <PermToggle small label="وقت الوصول المتوقع" checked={g.can_edit_arrival} onChange={(v) => updateGroup(g.id, { can_edit_arrival: v })} />
                  <PermToggle small label="معلومات المحطة" checked={g.can_edit_station_info} onChange={(v) => updateGroup(g.id, { can_edit_station_info: v })} />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-bold text-muted-foreground">المحطات ({gStations.length})</div>
                  <Button variant="outline" size="sm" onClick={() => { setAddStationFor(addStationFor === g.id ? null : g.id); setPickStation(""); }}>
                    <Plus className="h-3 w-3" /> محطة
                  </Button>
                </div>
                {addStationFor === g.id && (
                  <div className="mb-2 flex gap-2">
                    <Select value={pickStation} onValueChange={setPickStation}>
                      <SelectTrigger><SelectValue placeholder="اختر محطة" /></SelectTrigger>
                      <SelectContent>
                        {stations.filter((s) => !gStations.some((x) => x.station_id === s.id)).map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name} — {s.city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => addStation(g.id)}>إضافة</Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {gStations.map((x) => {
                    const st = stations.find((s) => s.id === x.station_id);
                    return (
                      <span key={x.id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                        {st?.name || "?"}
                        <button onClick={() => removeStation(x.id)} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-bold text-muted-foreground">الأعضاء ({gMembers.length})</div>
                  <Button variant="outline" size="sm" onClick={() => { setAddMemberFor(addMemberFor === g.id ? null : g.id); setPickMember(""); }}>
                    <Plus className="h-3 w-3" /> عضو
                  </Button>
                </div>
                {addMemberFor === g.id && (
                  <div className="mb-2 flex gap-2">
                    <Select value={pickMember} onValueChange={setPickMember}>
                      <SelectTrigger><SelectValue placeholder="اختر مدير" /></SelectTrigger>
                      <SelectContent>
                        {managers.filter((m) => !gMembers.some((x) => x.user_id === m.id)).map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => addMember(g.id)}>إضافة</Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {gMembers.map((x) => {
                    const mgr = managers.find((m) => m.id === x.user_id);
                    return (
                      <span key={x.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                        {mgr?.full_name || mgr?.email || "?"}
                        <button onClick={() => removeMember(x.id)} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


function PermToggle({ label, checked, onChange, small }: { label: string; checked: boolean; onChange: (v: boolean) => void; small?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={small ? "text-xs" : ""}>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function EditStationTab() {
  const [stations, setStations] = useState<Station[]>([]);
  const [sel, setSel] = useState<string>("");
  useEffect(() => {
    supabase.from("stations").select("*").order("city").then(({ data }) => {
      setStations((data as Station[]) ?? []);
      if (data && data[0]) setSel(data[0].id);
    });
  }, []);
  const station = stations.find((s) => s.id === sel);
  return (
    <div className="space-y-4">
      <Select value={sel} onValueChange={setSel}>
        <SelectTrigger><SelectValue placeholder="اختر محطة" /></SelectTrigger>
        <SelectContent>{stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
      </Select>
      {station && (
        <StationEditor
          station={station}
          perms={{ can_edit_fuels: true, can_edit_arrival: true, can_edit_station_info: true }}
          isSuperAdmin
        />
      )}
    </div>
  );
}

type Announcement = { id: string; message: string; is_active: boolean; updated_at: string };

function NewsTab() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from("announcements").select("*").order("updated_at", { ascending: false });
    setItems((data as Announcement[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!message.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("announcements").insert({ message: message.trim(), is_active: true });
    setBusy(false);
    if (error) return toast.error(error.message);
    setMessage("");
    toast.success("تمت إضافة الخبر");
    load();
  }

  async function toggle(a: Announcement) {
    const { error } = await supabase.from("announcements").update({ is_active: !a.is_active }).eq("id", a.id);
    if (error) return toast.error(error.message);
    load();
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا الخبر؟")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> شريط الأخبار العاجلة</CardTitle>
          <CardDescription>يظهر هذا الشريط في أعلى الصفحة الرئيسية لكل المستخدمين — يتحكم به الأدمن الرئيسي فقط.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="اكتب نص الخبر العاجل هنا..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="text-right"
          />
          <Button onClick={add} disabled={busy || !message.trim()}>
            <Plus className="ml-1 h-4 w-4" /> إضافة خبر
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {items.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
            لا توجد أخبار بعد.
          </div>
        )}
        {items.map((a) => (
          <Card key={a.id} className={a.is_active ? "border-primary/40" : "opacity-60"}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex-1 text-sm font-medium">{a.message}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{a.is_active ? "ظاهر" : "مخفي"}</span>
                <Switch checked={a.is_active} onCheckedChange={() => toggle(a)} />
                <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
