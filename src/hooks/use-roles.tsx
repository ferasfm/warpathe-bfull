import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export type AppRole = 'super_admin' | 'admin' | 'user';

export function useRoles() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['user-roles', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      return data.map(r => r.role as AppRole);
    },
    enabled: !!session?.user?.id,
  });

  const isSuperAdmin = roles.includes('super_admin');
  const isAdmin = roles.includes('admin') || isSuperAdmin;
  const isUser = roles.includes('user') || isAdmin;

  return {
    roles,
    isSuperAdmin,
    isAdmin,
    isUser,
    isLoading,
  };
}
