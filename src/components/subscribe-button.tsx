import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FUEL_LABELS, FUEL_ORDER, type FuelType } from "@/lib/fuel-types";
import { ensureNotificationPermission, getStationSubs, setStationSubs } from "@/lib/subscriptions";
import { toast } from "sonner";

export function SubscribeButton({ stationId, stationName }: { stationId: string; stationName: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FuelType[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(getStationSubs(stationId).length);
    sync();
    window.addEventListener("huda-subs-changed", sync);
    return () => window.removeEventListener("huda-subs-changed", sync);
  }, [stationId]);

  function openDialog() {
    setSelected(getStationSubs(stationId));
    setOpen(true);
  }

  function toggle(ft: FuelType) {
    setSelected((s) => (s.includes(ft) ? s.filter((x) => x !== ft) : [...s, ft]));
  }

  async function save() {
    if (selected.length > 0) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        toast.error("يرجى السماح بالإشعارات في المتصفح");
        return;
      }
    }
    setStationSubs(stationId, selected);
    toast.success(selected.length ? "تم تفعيل الإشعارات" : "تم إلغاء الاشتراك");
    setOpen(false);
  }

  const active = count > 0;

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        title="اشترك بإشعارات توفر الوقود"
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
          active
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "bg-muted text-foreground hover:bg-accent"
        }`}
      >
        {active ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
        {active ? `مشترك (${count})` : "إشعارني"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-right">إشعارات {stationName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            اختر أنواع الوقود لتصلك رسالة فور توفرها في هذه المحطة.
          </p>
          <div className="space-y-2">
            {FUEL_ORDER.map((ft) => (
              <label
                key={ft}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 hover:bg-accent"
              >
                <span className="font-medium">{FUEL_LABELS[ft]}</span>
                <Checkbox checked={selected.includes(ft)} onCheckedChange={() => toggle(ft)} />
              </label>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={save}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
