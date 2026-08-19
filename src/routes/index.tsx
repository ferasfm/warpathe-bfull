import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FUEL_LABELS, FUEL_ORDER, type FuelType } from "@/lib/fuel-types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Clock, Fuel, Search, Radio, MessageCircle, Navigation2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { SubscribeButton } from "@/components/subscribe-button";
import { loadSubs, fireNotification } from "@/lib/subscriptions";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppShare } from "@/components/WhatsAppShare";
// CrowdStatus imported but currently disabled as per user request to remove crowd confirmations feature
// // import { CrowdStatus } from "@/components/CrowdStatus";


function waNumber(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "970" + d.slice(1);
  return d;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} م`;
  return `${km.toFixed(km < 10 ? 1 : 0)} كم`;
}


/*
'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''


هل هناك اقتراحات
*/

import { NewsTicker } from "@/components/news-ticker";
import { InstallPWA } from "@/components/install-pwa";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "شركة الهدى للمحروقات — توفر الوقود المباشر في الضفة الغربية" },
      { name: "description", content: "تعرّف الآن على توفر البنزين 95 و 98 والسولار والكاز والغاز في جميع محطات شركة الهدى للمحروقات في الضفة الغربية." },
      { property: "og:title", content: "شركة الهدى للمحروقات — توفر الوقود المباشر" },
      { property: "og:description", content: "تحديث فوري لحالة الوقود في محطات شركة الهدى بالضفة الغربية." },
    ],
  }),
  component: HomePage,
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

type FuelRow = {
  id: string;
  station_id: string;
  fuel_type: FuelType;
  is_available: boolean;
  expected_arrival: string | null;
  note: string | null;
};

function HomePage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fuels, setFuels] = useState<FuelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FuelType | "all">("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [sortByNearest, setSortByNearest] = useState(false);

  function requestLocation() {
    if (!navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortByNearest(true);
        setLocating(false);
        toast.success("تم تحديد موقعك");
      },
      (err) => {
        setLocating(false);
        toast.error(err.code === 1 ? "تم رفض إذن الموقع" : "تعذّر تحديد الموقع");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  useEffect(() => {
    let mounted = true;
    async function load() {


      const [s, f] = await Promise.all([
        supabase.from("stations").select("*").eq("is_active", true).order("city"),
        supabase.from("station_fuels").select("*"),
      ]);
      if (!mounted) return;
      setStations((s.data as Station[]) ?? []);
      setFuels((f.data as FuelRow[]) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("public-fuel-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "station_fuels" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "stations" }, () => load())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Detect transitions from unavailable → available for subscribed fuels
  const prevAvailRef = useRef<Map<string, boolean> | null>(null);
  useEffect(() => {
    if (fuels.length === 0) return;
    const current = new Map<string, boolean>();
    fuels.forEach((f) => current.set(`${f.station_id}:${f.fuel_type}`, f.is_available));
    const prev = prevAvailRef.current;
    if (prev) {
      const subs = loadSubs();
      const stationName = new Map(stations.map((s) => [s.id, s.name]));
      Object.entries(subs).forEach(([stationId, fts]) => {
        fts.forEach((ft) => {
          const key = `${stationId}:${ft}`;
          if (current.get(key) === true && prev.get(key) === false) {
            fireNotification(
              "⛽ توفّر الوقود الآن",
              `${FUEL_LABELS[ft]} أصبح متوفراً في ${stationName.get(stationId) ?? "المحطة"}`
            );
          }
        });
      });
    }
    prevAvailRef.current = current;
  }, [fuels, stations]);

  const fuelsByStation = new Map<string, FuelRow[]>();
  fuels.forEach((f) => {
    if (!fuelsByStation.has(f.station_id)) fuelsByStation.set(f.station_id, []);
    fuelsByStation.get(f.station_id)!.push(f);
  });

  const withDistance = stations.map((s) => {
    const dist = userLoc && s.latitude != null && s.longitude != null
      ? haversineKm(userLoc.lat, userLoc.lng, Number(s.latitude), Number(s.longitude))
      : null;
    return { station: s, dist };
  });

  const filtered = withDistance.filter(({ station: s }) => {
    const q = query.trim();
    if (q && !`${s.name} ${s.city} ${s.address ?? ""}`.includes(q)) return false;
    
    if (selectedRegion !== "all" && s.region !== selectedRegion) return false;

    if (filter !== "all") {
      const sf = fuelsByStation.get(s.id) ?? [];
      const item = sf.find((x) => x.fuel_type === filter);
      if (!item || !item.is_available) return false;
    }
    return true;
  });

  if (sortByNearest && userLoc) {
    filtered.sort((a, b) => {
      if (a.dist == null) return 1;
      if (b.dist == null) return -1;
      return a.dist - b.dist;
    });
  }


  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <NewsTicker />
      <SiteHeader />
      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 20% 30%, oklch(0.55 0.22 27) 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1.5 text-[10px] font-bold text-primary-foreground ring-1 ring-primary/40 sm:mb-3 sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            تحديث لحظي مباشر
          </div>
          <h2 className="text-2xl font-black leading-tight sm:text-5xl">
            وقودك <span className="text-primary">متوفر الآن</span><br />في محطات الهدى
          </h2>

          <p className="mt-4 max-w-xl text-xs leading-relaxed text-secondary-foreground/80 sm:mt-3 sm:text-base">
            اطلع على توفر البنزين والسولار والكاز والغاز في جميع محطاتنا بالضفة الغربية بشكل فوري.
          </p>
        </div>
      </section>

      {/* Search + filter */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur shadow-sm transition-all duration-200">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم المحطة أو المدينة..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 border-2 pr-9 text-right text-sm focus-visible:ring-primary/20"
              />
            </div>
            
            <div className="space-y-4 sm:space-y-3">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-muted-foreground/60 px-1 uppercase tracking-widest">تصفية حسب المنطقة</span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                  <FilterChip active={selectedRegion === "all"} onClick={() => setSelectedRegion("all")}>الكل</FilterChip>
                  <FilterChip active={selectedRegion === "North"} onClick={() => setSelectedRegion("North")}>الشمال</FilterChip>
                  <FilterChip active={selectedRegion === "Central"} onClick={() => setSelectedRegion("Central")}>الوسط</FilterChip>
                  <FilterChip active={selectedRegion === "South"} onClick={() => setSelectedRegion("South")}>الجنوب</FilterChip>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-muted-foreground/60 px-1 uppercase tracking-widest">تصفية حسب نوع الوقود</span>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    <FilterChip active={filter === "all"} onClick={() => setFilter("all")} variant="secondary">الكل</FilterChip>
                    {FUEL_ORDER.map((ft) => (
                      <FilterChip key={ft} active={filter === ft} onClick={() => setFilter(ft)} variant="secondary">
                        {FUEL_LABELS[ft]}
                      </FilterChip>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant={sortByNearest && userLoc ? "default" : "outline"}
                    onClick={() => {
                      if (userLoc) setSortByNearest((v) => !v);
                      else requestLocation();
                    }}
                    disabled={locating}
                    className="mr-auto shrink-0 h-9 rounded-full px-4 text-[11px] font-bold shadow-sm sm:h-8 sm:text-xs"
                  >
                    <Navigation2 className="ml-1.5 h-3.5 w-3.5" />
                    {locating ? "جاري التحديد..." : userLoc ? (sortByNearest ? "الأقرب" : "ترتيب حسب الأقرب") : "أقرب المحطات"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed p-12 text-center text-muted-foreground">
            لا توجد محطات تطابق البحث.
          </div>
        ) : sortByNearest && userLoc ? (
          <section>
            <div className="mb-3 flex items-center gap-2 border-r-4 border-primary pr-3">
              <Navigation2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-black">الأقرب إليك</h3>
              <span className="text-xs text-muted-foreground">({filtered.length} محطة)</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(({ station, dist }) => (
                <StationCard key={station.id} station={station} fuels={fuelsByStation.get(station.id) ?? []} distanceKm={dist} />
              ))}
            </div>
          </section>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ station, dist }) => (
              <StationCard key={station.id} station={station} fuels={fuelsByStation.get(station.id) ?? []} distanceKm={dist} />
            ))}
          </div>
        )}

      </main>

      <footer className="mt-16 border-t bg-secondary py-12 text-center text-sm text-secondary-foreground/70 sm:py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-center gap-2 font-black text-secondary-foreground mb-4 sm:mb-2">
            <Radio className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-base sm:text-lg">شركة الهدى للمحروقات</span>
          </div>
          <p className="mb-6 text-xs font-medium sm:mb-2">مصدرك الموثوق للوقود الممتاز والخدمات المتكاملة</p>
          <div className="flex flex-col items-center justify-center gap-y-3 text-xs mb-8 sm:flex-row sm:gap-x-4 sm:gap-y-1 sm:mb-4" dir="ltr">
            <a href="tel:022444444" className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 hover:bg-white/10 transition-colors">
              <Phone className="h-3.5 w-3.5" />
              <span>{'\u200E'}02-2444444</span>
            </a>
            <a href="tel:0598606060" className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 hover:bg-white/10 transition-colors">
              <Phone className="h-3.5 w-3.5" />
              <span>{'\u200E'}0598-606060</span>
            </a>
            <a href="mailto:info@alhuda.ps" className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 hover:bg-white/10 transition-colors">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>info@alhuda.ps</span>
            </a>
          </div>
          <p className="text-[10px] font-medium opacity-50 uppercase tracking-widest">© {new Date().getFullYear()} جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}

function FilterChip({ 
  active, 
  onClick, 
  children,
  variant = "primary"
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  variant?: "primary" | "secondary"
}) {
  const baseClasses = "shrink-0 rounded-full px-4 py-2 text-[11px] font-black transition-all shadow-sm border whitespace-nowrap sm:px-4 sm:py-1.5 sm:text-sm";
  const activeClasses = variant === "primary" 
    ? "bg-primary text-primary-foreground border-primary scale-105" 
    : "bg-secondary text-secondary-foreground border-primary/40 scale-105";
  const inactiveClasses = "bg-background text-muted-foreground border-border hover:bg-accent hover:border-muted-foreground/30";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
    >
      {children}
    </button>
  );
}

function StationCard({ station, fuels, distanceKm }: { station: Station; fuels: FuelRow[]; distanceKm?: number | null }) {
  const availableFuels = fuels.filter((f) => f.is_available);
  const availableCount = availableFuels.length;
  const total = FUEL_ORDER.length;
  const anyAvailable = availableCount > 0;

  return (
    <Card className="group overflow-hidden border-2 p-0 transition hover:border-primary/50 hover:shadow-lg">
      <div className={`px-4 py-3 ${anyAvailable ? "bg-success/10" : "bg-destructive/10"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-black leading-tight text-foreground sm:truncate sm:text-base">
              {station.name.replace("محطة الهدى للمحروقات", "الهدى").trim()}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-muted-foreground/70 sm:text-xs">
              <MapPin className="h-3 w-3 shrink-0" /> {station.city}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={`rounded-full px-2 py-0 text-[10px] font-black sm:text-xs ${anyAvailable ? "bg-success text-success-foreground hover:bg-success/90" : "bg-destructive text-destructive-foreground"}`}>
              {anyAvailable ? `متوفر ${availableCount}/${total}` : "غير متوفر"}
            </Badge>
            {distanceKm != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <Navigation2 className="h-3 w-3" /> {formatDistance(distanceKm)}
              </span>
            )}
            <div className="flex gap-1 items-center">
              <SubscribeButton stationId={station.id} stationName={station.name} />
              {station.google_maps_url && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full text-primary hover:bg-primary/10"
                  asChild
                >
                  <a href={station.google_maps_url} target="_blank" rel="noopener noreferrer">
                    <Navigation2 className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>


      <div className="space-y-3 p-4">
        <div className="grid grid-cols-5 gap-1.5">
          {FUEL_ORDER.map((ft) => {
            const item = fuels.find((f) => f.fuel_type === ft);
            const isAvail = item?.is_available ?? false;
            return (
              <div
                key={ft}
                className={`rounded-lg border p-2 text-center text-[10px] font-semibold ${
                  isAvail
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border bg-muted text-muted-foreground opacity-60"
                }`}
                title={FUEL_LABELS[ft]}
              >
                <div className="text-base leading-none">{isAvail ? "✓" : "✕"}</div>
                <div className="mt-1 truncate">{FUEL_LABELS[ft]}</div>
                {item?.expected_arrival && !isAvail && (
                  <div className="mt-0.5 truncate text-[9px] text-warning">قادم</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Crowd Confirmations disabled */}
        {/* <div className="space-y-2">
          {FUEL_ORDER.map(ft => {
            const item = fuels.find(f => f.fuel_type === ft);
            if (!item) return null;
            return <CrowdStatus key={ft} stationId={station.id} fuelType={ft} />;
          })}
        </div> */}

        {/* Expected arrivals */}
        {fuels.some((f) => !f.is_available && f.expected_arrival) && (
          <div className="rounded-lg bg-warning/10 p-2 text-xs text-foreground">
            <div className="mb-1 font-semibold text-warning-foreground">وقت الوصول المتوقع:</div>
            {fuels
              .filter((f) => !f.is_available && f.expected_arrival)
              .map((f) => (
                <div key={f.id} className="flex justify-between">
                  <span>{FUEL_LABELS[f.fuel_type]}</span>
                  <span className="text-muted-foreground">
                    {new Date(f.expected_arrival!).toLocaleString("ar", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
              ))}
          </div>
        )}

        <div className="space-y-1.5 border-t pt-3 text-xs text-muted-foreground">
          {station.address && (
            <div className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{station.address}</span>
            </div>
          )}
          {station.working_hours && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{station.working_hours}</span>
            </div>
          )}
          {station.phone && (
            <div className="flex flex-wrap items-center gap-2">
              <a href={`tel:${station.phone}`} className="flex items-center gap-1.5 hover:text-primary">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span dir="ltr">{station.phone}</span>
              </a>
              <a
                href={`https://wa.me/${waNumber(station.phone)}?text=${encodeURIComponent(
                  `مرحباً، أستفسر عن توفر المحروقات في محطة ${station.name} - ${station.city}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90"
                aria-label="تواصل عبر واتساب"
              >
                <MessageCircle className="h-3 w-3" /> واتساب
              </a>
            </div>
          )}

        </div>

        <div className="flex gap-2">
          {station.google_maps_url && (
            <a
              href={station.google_maps_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-lg bg-secondary py-2 text-center text-xs font-semibold text-secondary-foreground transition hover:bg-secondary/90"
            >
              📍 فتح في خرائط جوجل
            </a>
          )}
          <WhatsAppShare 
            stationName={station.name} 
            city={station.city} 
            availableFuels={availableFuels.map(f => f.fuel_type)} 
            mapUrl={station.google_maps_url} 
          />
        </div>
      </div>
    </Card>
  );
}
