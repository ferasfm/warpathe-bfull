import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { updateSiteSetting } from "@/lib/settings.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImageIcon, Loader2, Upload } from "lucide-react";

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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      await updateSetting({ data: { key: "logo_url", value: publicUrl } });
      toast.success("تم رفع وتحديث الشعار بنجاح");
    } catch (err) {
      toast.error("فشل رفع الصورة: " + (err as Error).message);
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>شعار الموقع</Label>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input 
                    id="logo-url"
                    dir="ltr" 
                    value={logoUrl} 
                    onChange={(e) => setLogoUrl(e.target.value)} 
                    placeholder="https://example.com/logo.png"
                    className="flex-1"
                  />
                  <Button onClick={handleSave} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ الرابط"}
                  </Button>
                </div>
                
                <div className="relative">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleUpload} 
                    disabled={busy}
                    className="hidden" 
                    id="logo-upload"
                  />
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed py-8 h-auto flex flex-col gap-2"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={busy}
                  >
                    {busy ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium">اضغط لرفع شعار جديد من جهازك</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="mb-2 text-sm font-bold flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                معاينة الشعار الحالي
              </div>
              <div className="flex justify-center bg-white p-6 rounded-md border border-dashed min-h-[120px] items-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Preview" className="max-h-24 object-contain" />
                ) : (
                  <div className="text-xs text-muted-foreground">لا يوجد شعار محدد</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
