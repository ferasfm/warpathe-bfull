import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/layout/Sidebar";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: location.href,
        },
      });
    }

    // Server-side check for /admin route
    if (location.pathname.startsWith('/admin')) {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      const roleList = roles?.map(r => r.role) || [];
      const isAdmin = roleList.includes('admin') || roleList.includes('super_admin');
      
      if (!isAdmin) {
        console.warn("Access denied to admin route for user:", session.user.id, "Roles:", roleList);
        throw redirect({ to: '/dashboard' });
      }
    }

    return { session };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
