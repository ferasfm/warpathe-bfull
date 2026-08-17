import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Fuel, Menu, ShieldCheck, X } from "lucide-react";

const navItems = [
  { to: "/", label: "الرئيسية" },
  { to: "/about", label: "من نحن" },
  { to: "/services", label: "خدماتنا" },
];

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("https://alhuda.ps/wp-content/uploads/2025/03/cropped-cropped-434028226_889142969677554_7540231448891951221_n-1.png");

  useEffect(() => {
    async function loadLogo() {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "logo_url")
        .maybeSingle();
      if (data?.value) setLogoUrl(data.value as string);
    }
    loadLogo();
    
    const channel = supabase
      .channel("site_settings_logo")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "site_settings", filter: "key=eq.logo_url" }, (payload) => {
        if (payload.new && (payload.new as any).value) {
          setLogoUrl((payload.new as any).value);
        }
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="border-b bg-secondary text-secondary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white shadow-lg overflow-hidden border border-primary/20">
            <img 
              src={logoUrl} 
              alt="شعار شركة الهدى" 
              className="h-full w-full object-contain p-1"
            />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black leading-tight sm:text-xl">شركة الهدى للمحروقات</h1>
            <p className="text-[11px] text-secondary-foreground/70">هاتف: 02-2444444</p>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 sm:flex sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive(item.to)
                  ? "bg-primary/10 text-primary"
                  : "text-secondary-foreground/90 hover:bg-secondary-foreground/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/auth">
            <Button
              variant="outline"
              size="sm"
              className="mr-2 border-secondary-foreground/20 bg-transparent text-secondary-foreground hover:bg-secondary-foreground/10"
            >
              <ShieldCheck className="ml-1 h-4 w-4" /> دخول الإدارة
            </Button>
          </Link>
        </nav>

        {/* Mobile menu */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link to="/auth">
            <Button
              variant="outline"
              size="sm"
              className="border-secondary-foreground/20 bg-transparent text-secondary-foreground hover:bg-secondary-foreground/10"
            >
              <ShieldCheck className="ml-1 h-4 w-4" />
              <span className="sr-only">دخول الإدارة</span>
            </Button>
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="فتح القائمة"
                className="border-secondary-foreground/20 bg-transparent text-secondary-foreground hover:bg-secondary-foreground/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] border-l border-border bg-secondary p-0">
              <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-secondary-foreground/10 px-4 py-4">
                  <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-lg overflow-hidden border border-primary/20">
                      <img 
                        src={logoUrl} 
                        alt="شعار شركة الهدى" 
                        className="h-full w-full object-contain p-1"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-black">شركة الهدى</div>
                      <div className="text-[10px] text-secondary-foreground/70">02-2444444</div>
                    </div>
                  </Link>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="إغلاق القائمة"
                      className="text-secondary-foreground hover:bg-secondary-foreground/10"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>
                <nav className="flex-1 space-y-1 p-4">
                  {navItems.map((item) => (
                    <SheetClose key={item.to} asChild>
                      <Link
                        to={item.to}
                        className={`block rounded-lg px-4 py-3 text-base font-semibold transition ${
                          isActive(item.to)
                            ? "bg-primary text-primary-foreground"
                            : "text-secondary-foreground hover:bg-secondary-foreground/10"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <div className="border-t border-secondary-foreground/10 p-4">
                  <SheetClose asChild>
                    <Link to="/auth">
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        <ShieldCheck className="ml-2 h-4 w-4" /> دخول الإدارة
                      </Button>
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
