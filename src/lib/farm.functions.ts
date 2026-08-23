import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * RBAC Helper
 * Verify if the authenticated user has a specific role.
 */
const checkRole = async (supabase: any, userId: string, allowedRoles: string[]) => {
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  
  const roles = (roleData?.map((r: any) => r.role) || []) as string[];
  const isAllowed = allowedRoles.some(role => roles.includes(role));
  
  if (!isAllowed) {
    throw new Error("Forbidden: Insufficient permissions");
  }
};

/**
 * FARM SECURITY
 */

export const getAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    return data;
  });

export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { name: string, notes?: string, status?: string }) => z.object({
    name: z.string().min(1),
    notes: z.string().optional(),
    status: z.string().optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    
    const { data: result, error } = await supabase
      .from("accounts")
      .insert(data)
      .select()
      .single();
      
    if (error) throw error;
    return result;
  });

export const updateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string, name?: string, notes?: string, status?: string }) => z.object({
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    notes: z.string().optional(),
    status: z.string().optional()
  }).parse(data))
  .handler(async ({ data: { id, ...updates }, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    
    const { data: result, error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;
    return result;
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: { id }, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", id);
      
    if (error) throw error;
    return { success: true };
  });

/**
 * FARM MANAGEMENT
 */

export const getFarms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    
    const { data, error } = await supabase
      .from("farms")
      .select("*, accounts(name)")
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    return data;
  });

export const createFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { name: string, account_id: string, notes?: string, status?: string }) => z.object({
    name: z.string().min(1),
    account_id: z.string().uuid(),
    notes: z.string().optional(),
    status: z.string().optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    
    const { data: result, error } = await supabase
      .from("farms")
      .insert(data)
      .select()
      .single();
      
    if (error) throw error;
    return result;
  });

export const updateFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string, name?: string, account_id?: string, notes?: string, status?: string }) => z.object({
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    account_id: z.string().uuid().optional(),
    notes: z.string().optional(),
    status: z.string().optional()
  }).parse(data))
  .handler(async ({ data: { id, ...updates }, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    
    const { data: result, error } = await supabase
      .from("farms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;
    return result;
  });

export const deleteFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: { id }, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    
    const { error } = await supabase
      .from("farms")
      .delete()
      .eq("id", id);
      
    if (error) throw error;
    return { success: true };
  });

/**
 * USER ASSIGNMENTS
 */

export const getFarmUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { farmId: string }) => z.object({ farmId: z.string().uuid() }).parse(data))
  .handler(async ({ data: { farmId }, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    
    const { data: result, error } = await supabase
      .from("farm_users")
      .select("*, profiles(full_name, email)")
      .eq("farm_id", farmId);
      
    if (error) throw error;
    return result;
  });

export const assignUserToFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { farmId: string, userId: string }) => z.object({
    farmId: z.string().uuid(),
    userId: z.string().uuid()
  }).parse(data))
  .handler(async ({ data: { farmId, userId: targetUserId }, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    
    const { data: result, error } = await supabase
      .from("farm_users")
      .insert({ farm_id: farmId, user_id: targetUserId })
      .select()
      .single();
      
    if (error) {
        if (error.code === '23505') throw new Error("User is already assigned to this farm");
        throw error;
    }
    return result;
  });

export const removeUserFromFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { assignmentId: string }) => z.object({ assignmentId: z.string().uuid() }).parse(data))
  .handler(async ({ data: { assignmentId }, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    
    const { error } = await supabase
      .from("farm_users")
      .delete()
      .eq("id", assignmentId);
      
    if (error) throw error;
    return { success: true };
  });
