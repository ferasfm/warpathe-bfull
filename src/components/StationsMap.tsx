import React, { useEffect, useState, useMemo } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { FUEL_LABELS, FUEL_ORDER } from "@/lib/fuel-types";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Station {
  id: string;
  name: string;
  city: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface FuelRow {
  station_id: string;
  fuel_type: string;
  is_available: boolean;
}

interface Props {
  stations: Station[];
  fuels: FuelRow[];
  apiKey: string;
  fullHeight?: boolean;
}

export function StationsMap({ stations, fuels, apiKey, fullHeight = false }: Props) {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const stationsWithCoords = useMemo(() => 
    stations.filter((s) => s.latitude !== null && s.longitude !== null),
    [stations]
  );

  // Default center: West Bank area
  const defaultCenter = useMemo(() => {
    if (stationsWithCoords.length === 0) return { lat: 32.0, lng: 35.2 };
    const lats = stationsWithCoords.map(s => Number(s.latitude));
    const lngs = stationsWithCoords.map(s => Number(s.longitude));
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  }, [stationsWithCoords]);

  const defaultZoom = stationsWithCoords.length > 1 ? 9 : 12;

  if (stationsWithCoords.length === 0) return null;

  const getStationStatus = (stationId: string) => {
    const stationFuels = fuels.filter((f) => f.station_id === stationId);
    const available = stationFuels.filter((f) => f.is_available).length;
    const total = FUEL_ORDER.length;
    return { available, total, anyAvailable: available > 0 };
  };

  return (
    <div className={`w-full ${fullHeight ? 'h-full' : 'h-[400px] mb-8'} rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border-2 border-primary/20 shadow-none sm:shadow-inner bg-muted relative`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          mapId="ALHUDA_MAP_ID"
          className="w-full h-full"
          disableDefaultUI={false}
          clickableIcons={false}
          gestureHandling={fullHeight ? 'greedy' : 'auto'}
        >
          {stationsWithCoords.map((station) => {
            const { available, total, anyAvailable } = getStationStatus(station.id);
            const position = {
              lat: Number(station.latitude),
              lng: Number(station.longitude),
            };

            return (
              <AdvancedMarker
                key={station.id}
                position={position}
                onClick={() => setSelectedStation(station)}
              >
                <div className="group relative cursor-pointer transform hover:scale-110 transition-transform">
                  <div 
                    className={`w-6 h-6 sm:w-5 sm:h-5 rounded-full border-2 border-white shadow-lg ${
                      anyAvailable ? "bg-green-500 shadow-green-500/40" : "bg-red-500 shadow-red-500/40"
                    }`}
                  />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-white" />
                </div>
              </AdvancedMarker>
            );
          })}

          {selectedStation && (
            <InfoWindow
              position={{
                lat: Number(selectedStation.latitude),
                lng: Number(selectedStation.longitude),
              }}
              onCloseClick={() => setSelectedStation(null)}
            >
              <div className="p-2 min-w-[200px] text-right" dir="rtl">
                <h4 className="font-black text-sm text-primary mb-1">
                  {selectedStation.name.replace("محطة الهدى للمحروقات", "الهدى")}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3" />
                  {selectedStation.city}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {fuels
                    .filter((f) => f.station_id === selectedStation.id && f.is_available)
                    .map((f) => (
                      <Badge key={f.fuel_type} variant="outline" className="text-[9px] px-1 py-0 bg-success/5 text-success border-success/30">
                        {FUEL_LABELS[f.fuel_type as keyof typeof FUEL_LABELS]}
                      </Badge>
                    ))}
                </div>

                <Button 
                  size="sm" 
                  className="w-full h-8 text-[11px] gap-2 font-black"
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedStation.latitude},${selectedStation.longitude}`;
                    window.open(url, "_blank");
                  }}
                >
                  <Navigation2 className="h-3.5 w-3.5" />
                  الحصول على الاتجاهات
                </Button>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
