import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getUserRoles = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { roles: [] };

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (error) throw error;
    return { roles: data.map((r) => r.role) };
  });

export const getAllUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    // Check if admin/super_admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);
    
    const roles = roleData?.map(r => r.role) || [];
    if (!roles.includes('admin') && !roles.includes('super_admin')) {
      throw new Error("Forbidden");
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        created_at,
        user_roles (role)
      `);

    if (error) throw error;
    return data;
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .input(z.object({
    userId: z.string(),
    newRole: z.enum(['super_admin', 'admin', 'user'])
  }))
  .handler(async ({ data: { userId, newRole } }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    // Get requester's role
    const { data: requesterRoleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);
    
    const requesterRoles = requesterRoleData?.map(r => r.role) || [];
    const isSuperAdmin = requesterRoles.includes('super_admin');
    const isAdmin = requesterRoles.includes('admin');

    if (!isSuperAdmin && !isAdmin) throw new Error("Forbidden");

    // Hierarchy rules
    if (!isSuperAdmin && newRole === 'super_admin') {
      throw new Error("Admins cannot promote to Super Admin");
    }

    // Check target's current role
    const { data: targetRoleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const targetRoles = targetRoleData?.map(r => r.role) || [];
    if (targetRoles.includes('super_admin') && !isSuperAdmin) {
      throw new Error("Admins cannot modify Super Admin roles");
    }

    // Update (or Insert)
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id, role' });

    if (error) throw error;
    return { success: true };
  });
