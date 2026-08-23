import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * RBAC Helper
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

// VISION ASSETS
export const getVisionAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { data, error } = await supabase
      .from('vision_assets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  });

export const createVisionAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    name: string,
    asset_type: string,
    storage_path?: string | null,
    version?: string,
    active?: boolean
  }) => z.object({
    name: z.string().min(1),
    asset_type: z.string().min(1),
    storage_path: z.string().optional().nullable(),
    version: z.string().default("1.0.0"),
    active: z.boolean().default(true)
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { data: result, error } = await supabase
      .from('vision_assets')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const updateVisionAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    id: string,
    name?: string,
    asset_type?: string,
    storage_path?: string | null,
    version?: string,
    active?: boolean
  }) => z.object({
    id: z.string().uuid(),
    name: z.string().optional(),
    asset_type: z.string().optional(),
    storage_path: z.string().optional().nullable(),
    version: z.string().optional(),
    active: z.boolean().optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { id, ...updates } = data;
    const { data: result, error } = await supabase
      .from('vision_assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const deleteVisionAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { error } = await supabase
      .from('vision_assets')
      .delete()
      .eq('id', data.id);
    if (error) throw error;
    return { success: true };
  });

// VISION RULES
export const getVisionRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { data, error } = await supabase
      .from('vision_rules')
      .select('*, vision_assets(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  });

export const createVisionRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    name: string,
    asset_id: string,
    confidence_threshold?: number,
    configuration?: any,
    active?: boolean
  }) => z.object({
    name: z.string().min(1),
    asset_id: z.string().uuid(),
    confidence_threshold: z.number().min(0).max(1).default(0.85),
    configuration: z.any().optional(),
    active: z.boolean().default(true)
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { data: result, error } = await supabase
      .from('vision_rules')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const updateVisionRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    id: string,
    name?: string,
    asset_id?: string,
    confidence_threshold?: number,
    configuration?: any,
    active?: boolean
  }) => z.object({
    id: z.string().uuid(),
    name: z.string().optional(),
    asset_id: z.string().uuid().optional(),
    confidence_threshold: z.number().min(0).max(1).optional(),
    configuration: z.any().optional(),
    active: z.boolean().optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { id, ...updates } = data;
    const { data: result, error } = await supabase
      .from('vision_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const deleteVisionRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { error } = await supabase
      .from('vision_rules')
      .delete()
      .eq('id', data.id);
    if (error) throw error;
    return { success: true };
  });

// RECOVERY RULES
export const getRecoveryRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { data, error } = await supabase
      .from('recovery_rules')
      .select('*')
      .order('priority', { ascending: true });
    if (error) throw error;
    return data;
  });

export const createRecoveryRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    name: string,
    trigger_type: string,
    priority?: number,
    configuration?: any,
    active?: boolean
  }) => z.object({
    name: z.string().min(1),
    trigger_type: z.string().min(1),
    priority: z.number().int().default(10),
    configuration: z.any().optional(),
    active: z.boolean().default(true)
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { data: result, error } = await supabase
      .from('recovery_rules')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const updateRecoveryRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    id: string,
    name?: string,
    trigger_type?: string,
    priority?: number,
    configuration?: any,
    active?: boolean
  }) => z.object({
    id: z.string().uuid(),
    name: z.string().optional(),
    trigger_type: z.string().optional(),
    priority: z.number().int().optional(),
    configuration: z.any().optional(),
    active: z.boolean().optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { id, ...updates } = data;
    const { data: result, error } = await supabase
      .from('recovery_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const deleteRecoveryRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { error } = await supabase
      .from('recovery_rules')
      .delete()
      .eq('id', data.id);
    if (error) throw error;
    return { success: true };
  });
