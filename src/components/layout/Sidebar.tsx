import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Settings, ShieldCheck, LogOut, Users, Sprout, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useRoles } from "@/hooks/use-roles";

export function Sidebar() {
  const navigate = useNavigate();
  const { isAdmin } = useRoles();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <aside className="w-64 border-l bg-card flex flex-col h-screen sticky top-0" dir="rtl">
      <div className="p-6 border-b flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black">W</div>
        <h1 className="text-xl font-black tracking-tighter">WARPATH</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 text-right">
        <NavItem to="/dashboard" icon={<LayoutDashboard className="w-4 h-4 ml-2" />} label="لوحة التحكم" />
        <NavItem to="/dashboard" icon={<Sprout className="w-4 h-4 ml-2" />} label="مزارعي" />
        <NavItem to="/dashboard" icon={<ClipboardList className="w-4 h-4 ml-2" />} label="المهام" />
        <NavItem to="/settings" icon={<Settings className="w-4 h-4 ml-2" />} label="الإعدادات" />
        
        {isAdmin && (
          <div className="pt-4 mt-4 border-t space-y-2">
            <div className="px-4 mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Admin Panel</span>
            </div>
            <NavItem to="/admin" icon={<ShieldCheck className="w-4 h-4 ml-2" />} label="Dashboard" />
            <NavItem to="/admin/users" icon={<Users className="w-4 h-4 ml-2" />} label="Users" />
            <NavItem to="/admin/accounts" icon={<ShieldCheck className="w-4 h-4 ml-2" />} label="Accounts" />
            <NavItem to="/admin/farms" icon={<ShieldCheck className="w-4 h-4 ml-2" />} label="Farms" />
            <NavItem to="/admin/resources" icon={<ShieldCheck className="w-4 h-4 ml-2" />} label="Resources" />
            <NavItem to="/admin/fleets" icon={<ShieldCheck className="w-4 h-4 ml-2" />} label="Fleets" />
            <NavItem to="/admin/missions" icon={<ShieldCheck className="w-4 h-4 ml-2" />} label="Missions" />
            <NavItem to="/admin/agents" icon={<ShieldCheck className="w-4 h-4 ml-2" />} label="Agents" />
            <NavItem to="/admin/devices" icon={<ShieldCheck className="w-4 h-4 ml-2" />} label="Devices" />
            <NavItem to="/admin/emulators" icon={<ShieldCheck className="w-4 h-4 ml-2" />} label="Emulators" />

            <NavItem to="/admin/vision" icon={<ShieldCheck className="w-4 h-4 ml-2" />} label="Vision" />
            <NavItem to="/admin/recovery" icon={<ShieldCheck className="w-4 h-4 ml-2" />} label="Recovery" />
            <NavItem to="/admin/logs" icon={<ShieldCheck className="w-4 h-4 ml-2" />} label="Audit Logs" />
            <NavItem to="/admin/settings" icon={<Settings className="w-4 h-4 ml-2" />} label="System Settings" />
          </div>
        )}
      </nav>

      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 ml-2" />
          تسجيل الخروج
        </Button>
      </div>
    </aside>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <Link 
      to={to} 
      activeProps={{ className: "bg-primary/10 text-primary" }}
      className="flex items-center justify-start flex-row-reverse gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-accent"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
