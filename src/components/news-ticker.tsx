import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";

type Announcement = { id: string; message: string; is_active: boolean };

export function NewsTicker() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase
        .from("announcements")
        .select("id, message, is_active")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      if (mounted) setItems((data as Announcement[]) ?? []);
    }
    load();
    const ch = supabase
      .channel("public-announcements")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => load())
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  if (items.length === 0) return null;

  const text = items.map((i) => i.message).join("   ★   ");

  return (
    <div className="flex items-stretch overflow-hidden border-b-2 border-primary/40 bg-primary text-primary-foreground shadow-md">
      <div className="flex shrink-0 items-center gap-1.5 bg-secondary px-3 py-2 text-xs font-black text-primary sm:text-sm">
        <Megaphone className="h-4 w-4 animate-pulse" />
        عاجل
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="ticker-track whitespace-nowrap py-2 text-sm font-semibold sm:text-base">
          <span className="mx-8">{text}</span>
          <span className="mx-8">{text}</span>
        </div>
      </div>
    </div>
  );
}
