import { useEffect, useState } from "react";
import { PlusSquare, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform("ios");
    } else if (/Android/.test(ua)) {
      setPlatform("android");
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructions(true);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstallClick}
        className="gap-2 h-8 text-[11px] font-bold border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary animate-bounce shadow-sm"
      >
        <PlusSquare className="h-3.5 w-3.5" />
        تثبيت التطبيق
      </Button>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-[90vw] sm:max-w-[425px] rounded-2xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
              <Smartphone className="h-5 w-5" />
              إضافة التطبيق للشاشة الرئيسية
            </DialogTitle>
            <DialogDescription className="text-right pt-2 text-base">
              للوصول السريع وتلقي التحديثات، يمكنك إضافة الموقع كـ "اختصار" على شاشة هاتفك.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {platform === "ios" ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl border border-border">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <Share className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">الخطوة الأولى</p>
                    <p className="text-sm text-muted-foreground">اضغط على زر "مشاركة" (Share) في أسفل المتصفح.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl border border-border">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <PlusSquare className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">الخطوة الثانية</p>
                    <p className="text-sm text-muted-foreground">اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl border border-border">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <div className="text-lg font-black leading-none mt-1">⋮</div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">الخطوة الأولى</p>
                    <p className="text-sm text-muted-foreground">اضغط على النقاط الثلاث في أعلى أو أسفل المتصفح.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl border border-border">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <PlusSquare className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">الخطوة الثانية</p>
                    <p className="text-sm text-muted-foreground">اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-center">
              <p className="text-xs text-primary font-medium">
                سيظهر شعار شركة الهدى على شاشتك للدخول المباشر للموقع في أي وقت.
              </p>
            </div>
            
            <Button 
              className="w-full rounded-xl h-11 font-bold" 
              onClick={() => setShowInstructions(false)}
            >
              حسناً، فهمت
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
