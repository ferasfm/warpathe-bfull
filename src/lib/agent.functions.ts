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

export const getAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  });

export const getDevices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { data, error } = await supabase
      .from('devices')
      .select('*, agents(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  });

export const getEmulators = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { data, error } = await supabase
      .from('emulators')
      .select('*, agents(name), devices(name, device_id), farms(name), current_run:mission_runs(status, mission:missions(name))')
      .order('name');
    if (error) throw error;
    return data;
  });

export const createEmulator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    name: string,
    agent_id: string,
    device_id: string,
    assigned_farm_id?: string | null,
    resolution?: string,
    dpi?: number,
    status?: string
  }) => z.object({
    name: z.string().min(1),
    agent_id: z.string().uuid(),
    device_id: z.string().uuid(),
    assigned_farm_id: z.string().uuid().optional().nullable(),
    resolution: z.string().default("1012x800"),
    dpi: z.number().default(200),
    status: z.string().default("OFFLINE")
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { data: result, error } = await supabase
      .from('emulators')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const updateEmulator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    id: string,
    name?: string,
    assigned_farm_id?: string | null,
    status?: string,
    resolution?: string,
    dpi?: number,
  }) => z.object({
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    assigned_farm_id: z.string().uuid().optional().nullable(),
    status: z.string().optional(),
    resolution: z.string().optional(),
    dpi: z.number().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { id, ...updates } = data;
    const { data: result, error } = await supabase
      .from('emulators')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const deleteEmulator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ['admin', 'super_admin']);
    const { error } = await supabase
      .from('emulators')
      .delete()
      .eq('id', data.id);
    if (error) throw error;
    return { success: true };
  });
