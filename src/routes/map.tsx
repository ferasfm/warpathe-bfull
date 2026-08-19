import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StationsMap } from "@/components/StationsMap";
import { SiteHeader } from "@/components/site-header";
import { type FuelType } from "@/lib/fuel-types";
import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "خريطة محطات الهدى — ابحث عن الوقود بصرياً" },
      { name: "description", content: "خريطة تفاعلية توضح مواقع محطات الهدى للمحروقات في الضفة الغربية وحالة توفر الوقود في كل منها." },
    ],
  }),
  component: MapPage,
});

type Station = {
  id: string;
  name: string;
  city: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
};

type FuelRow = {
  station_id: string;
  fuel_type: FuelType;
  is_available: boolean;
};

function MapPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fuels, setFuels] = useState<FuelRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [{ data: stData }, { data: fData }] = await Promise.all([
        supabase.from("stations").select("id, name, city, region, latitude, longitude").eq("is_active", true),
        supabase.from("station_fuels").select("station_id, fuel_type, is_available")
      ]);
      if (stData) setStations(stData);
      if (fData) setFuels(fData as FuelRow[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background" dir="rtl">
      <SiteHeader />
      
      <main className="flex-1 flex flex-col relative">
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
          <Link to="/" className="pointer-events-auto bg-background/95 backdrop-blur border shadow-lg rounded-full px-4 py-2 text-sm font-black flex items-center gap-2 hover:bg-accent transition-colors">
            <ArrowRight className="h-4 w-4" />
            رجوع للقائمة
          </Link>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm font-bold text-muted-foreground">جاري تحميل الخريطة...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 h-full w-full min-h-[calc(100vh-140px)]">
            <StationsMap 
              stations={stations} 
              fuels={fuels} 
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""} 
              fullHeight
            />
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-background/95 backdrop-blur border shadow-lg rounded-full px-5 py-2">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
              <span className="text-[10px] font-black">متوفر</span>
            </div>
            <div className="w-[1px] h-3 bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
              <span className="text-[10px] font-black">غير متوفر</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
