import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FUEL_LABELS, type FuelType } from "@/lib/fuel-types";

import { useRoles, useSession } from "@/lib/auth-hooks";

export function CrowdStatus({ stationId, fuelType }: { stationId: string; fuelType: FuelType }) {
  const { user } = useSession();
  const { isSuperAdmin, isManager } = useRoles(user?.id);
  const [stats, setStats] = useState({ available: 0, unavailable: 0 });
  const [myVote, setMyVote] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // If user is admin or manager, they shouldn't see/interact with crowd status
  // as they have the official status control in their dashboard.
  if (isSuperAdmin || isManager) return null;

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("user_confirmations")
        .select("is_available")
        .eq("station_id", stationId)
        .eq("fuel_type", fuelType)
        .gt("created_at", new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()); // Last 4 hours

      if (error) return;
      
      const available = data.filter(d => d.is_available).length;
      const unavailable = data.length - available;
      setStats({ available, unavailable });
      setLoading(false);
    }
    load();
  }, [stationId, fuelType]);

  async function vote(isAvailable: boolean) {
    if (myVote !== null) return;
    
    const { error } = await supabase.from("user_confirmations").insert({
      station_id: stationId,
      fuel_type: fuelType,
      is_available: isAvailable
    });

    if (error) {
      toast.error("فشل تسجيل رأيك");
      return;
    }

    setMyVote(isAvailable);
    setStats(prev => ({
      available: isAvailable ? prev.available + 1 : prev.available,
      unavailable: !isAvailable ? prev.unavailable + 1 : prev.unavailable
    }));
    toast.success("شكراً لمساهمتك في مساعدة الآخرين");
  }

  const total = stats.available + stats.unavailable;
  const confidence = total > 0 ? Math.round((stats.available / total) * 100) : null;

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg bg-muted/30 p-2 text-[10px]">
      <div className="flex items-center justify-between font-bold">
        <span className="text-muted-foreground">تأكيد الجمهور (آخر 4 ساعات):</span>
        {total > 0 ? (
          <span className="flex items-center gap-1 text-primary">
            {confidence! > 70 ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            ثقة {confidence}% ({total})
          </span>
        ) : (
          <span className="text-muted-foreground/60 italic text-[9px]">لا توجد تأكيدات بعد</span>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={myVote !== null}
          onClick={() => vote(true)}
          className="h-7 flex-1 gap-1 text-[9px] font-bold hover:bg-success/10 hover:text-success"
        >
          <ThumbsUp className="h-3 w-3" /> نعم متوفر
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={myVote !== null}
          onClick={() => vote(false)}
          className="h-7 flex-1 gap-1 text-[9px] font-bold hover:bg-destructive/10 hover:text-destructive"
        >
          <ThumbsDown className="h-3 w-3" /> لا، غير متوفر
        </Button>
      </div>
    </div>
  );
}
