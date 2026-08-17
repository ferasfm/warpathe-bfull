import { useEffect, useState } from "react";
import { Download, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMobile } from "@/hooks/use-mobile";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const isMobile = useMobile();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // If not supported/deferred (e.g., iOS Safari), show instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        toast("لإضافة الموقع للشاشة الرئيسية:", {
          description: "اضغط على زر المشاركة (Share) ثم اختر 'إضافة للشاشة الرئيسية' (Add to Home Screen)",
          duration: 6000,
        });
      } else {
        toast.info("المتصفح لا يدعم التثبيت المباشر، يمكنك الإضافة يدوياً من قائمة المتصفح");
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstall}
      className="gap-2 h-8 text-[11px] font-bold border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary animate-pulse shadow-sm"
    >
      <PlusSquare className="h-3.5 w-3.5" />
      تثبيت التطبيق
    </Button>
  );
}
