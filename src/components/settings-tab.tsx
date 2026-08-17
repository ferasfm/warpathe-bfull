import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { updateSiteSetting } from "@/lib/settings.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImageIcon, Loader2 } from "lucide-react";

export function SettingsTab() {
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const updateSetting = useServerFn(updateSiteSetting);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "logo_url")
        .maybeSingle();
      
      if (data) {
        setLogoUrl(data.value as string);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setBusy(true);
    try {
      await updateSetting({ data: { key: "logo_url", value: logoUrl } });
      toast.success("تم تحديث الشعار بنجاح");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">إعدادات الموقع</CardTitle>
          <CardDescription>تحكم في المظهر العام والهوية البصرية للموقع</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="logo-url">رابط الشعار الإدارة</Label>
            <div className="flex gap-2">
              <Input 
                id="logo-url"
                dir="ltr" 
                value={logoUrl} 
                onChange={(e) => setLogoUrl(e.target.value)} 
                placeholder="https://example.com/logo.png"
              />
              <Button onClick={handleSave} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="mb-2 text-sm font-bold flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              معاينة الشعار الحالي
            </div>
            <div className="flex justify-center bg-white p-6 rounded-md border border-dashed">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo Preview" className="max-h-24 object-contain" />
              ) : (
                <div className="text-xs text-muted-foreground">لا يوجد شعار محدد</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
