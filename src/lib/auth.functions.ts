import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getUserRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) throw error;
    return { roles: data.map((r) => r.role) };
  });

export const getAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Check if admin/super_admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const roles = (roleData?.map(r => r.role) || []) as string[];
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
        updated_at,
        user_roles (role)
      `);

    if (error) throw error;
    return data;
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { userId: string, newRole: 'super_admin' | 'admin' | 'user' }) => 
    z.object({
      userId: z.string(),
      newRole: z.enum(['super_admin', 'admin', 'user'])
    }).parse(data)
  )
  .handler(async ({ data: { userId, newRole }, context }) => {
    const { supabase, userId: requesterId } = context;

    // Get requester's role
    const { data: requesterRoleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId);
    
    const requesterRoles = (requesterRoleData?.map(r => r.role) || []) as string[];
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
    
    const targetRoles = (targetRoleData?.map(r => r.role) || []) as string[];
    if (targetRoles.includes('super_admin') && !isSuperAdmin) {
      throw new Error("Admins cannot modify Super Admin roles");
    }

    // Prevent Admin from promoting themselves (if they aren't already admin/super_admin, but they must be to reach here)
    // Specifically: "ADMIN must NOT promote themselves."
    // In our case, an Admin can change their own role to 'user' (demotion), but can they change to 'super_admin'? No, blocked by hierarchy.
    // Can they change from 'admin' to 'admin'? NOP.
    // The requirement is "Must NOT promote themselves". If they are ADMIN, they can't become SUPER_ADMIN anyway.
    if (userId === requesterId && !isSuperAdmin && newRole === 'super_admin') {
        throw new Error("You cannot promote yourself to Super Admin");
    }

    // Delete existing roles for this user first
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // Update
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });

    if (error) throw error;
    return { success: true };
  });
