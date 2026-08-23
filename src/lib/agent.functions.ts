import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const checkAdmin = async (supabase: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!roleData || (roleData.role !== 'admin' && roleData.role !== 'super_admin')) {
    throw new Error("Forbidden: Admin access required");
  }
  return user.id;
};

export const getAgents = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  });

export const getDevices = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from('devices')
      .select('*, agents(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  });

export const getEmulators = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from('emulators')
      .select('*, agents(name), devices(name, device_id), farms(name)')
      .order('name');
    if (error) throw error;
    return data;
  });

export const createEmulator = createServerFn({ method: "POST" })
  .input(z.object({
    name: z.string().min(1),
    agent_id: z.string().uuid(),
    device_id: z.string().uuid(),
    assigned_farm_id: z.string().uuid().optional().nullable(),
    resolution: z.string().default("1012x800"),
    dpi: z.number().default(200),
    status: z.string().default("OFFLINE")
  }))
  .handler(async ({ input }) => {
    await checkAdmin(supabase);
    const { data, error } = await supabase
      .from('emulators')
      .insert([input])
      .select()
      .single();
    if (error) throw error;
    return data;
  });

export const updateEmulator = createServerFn({ method: "POST" })
  .input(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    assigned_farm_id: z.string().uuid().optional().nullable(),
    status: z.string().optional(),
    resolution: z.string().optional(),
    dpi: z.number().optional(),
  }))
  .handler(async ({ input }) => {
    await checkAdmin(supabase);
    const { id, ...updates } = input;
    const { data, error } = await supabase
      .from('emulators')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  });

export const deleteEmulator = createServerFn({ method: "POST" })
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    await checkAdmin(supabase);
    const { error } = await supabase
      .from('emulators')
      .delete()
      .eq('id', input.id);
    if (error) throw error;
    return { success: true };
  });
