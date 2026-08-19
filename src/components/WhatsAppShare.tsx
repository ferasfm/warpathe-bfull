import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FUEL_LABELS, type FuelType } from "@/lib/fuel-types";

interface Props {
  stationName: string;
  city: string;
  availableFuels: FuelType[];
  mapUrl?: string | null;
}

export function WhatsAppShare({ stationName, city, availableFuels, mapUrl }: Props) {
  const share = () => {
    const fuelText = availableFuels.length > 0 
      ? "الوقود المتوفر: " + availableFuels.map(f => FUEL_LABELS[f]).join(" و ")
      : "للأسف، لا يوجد وقود متوفر حالياً.";
    
    const text = `⛽ *تحديث حالة الوقود في محطات الهدى*
📍 *المحطة:* ${stationName} (${city})
${fuelText}
${mapUrl ? `🗺️ *الموقع:* ${mapUrl}` : ""}
✅ تم التحديث عبر منصة الهدى الذكية`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={share}
      className="flex-1 h-8 gap-1.5 rounded-lg border-success/30 text-success hover:bg-success/10 hover:text-success"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      مشاركة واتساب
    </Button>
  );
}
