import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const checkAdmin = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id);
  
  const roles = (roleData?.map(r => r.role) || []) as string[];
  if (!roles.includes('admin') && !roles.includes('super_admin')) {
    throw new Error("Forbidden");
  }
  return session;
};

export const getAgents = createServerFn({ method: "GET" })
  .handler(async () => {
    await checkAdmin();
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  });

export const getDevices = createServerFn({ method: "GET" })
  .handler(async () => {
    await checkAdmin();
    const { data, error } = await supabase
      .from('devices')
      .select('*, agents(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  });

export const getEmulators = createServerFn({ method: "GET" })
  .handler(async () => {
    await checkAdmin();
    const { data, error } = await supabase
      .from('emulators')
      .select('*, agents(name), devices(name, device_id), farms(name)')
      .order('name');
    if (error) throw error;
    return data;
  });

export const createEmulator = createServerFn({ method: "POST" })
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
  .handler(async ({ data }) => {
    await checkAdmin();
    const { data: result, error } = await supabase
      .from('emulators')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const updateEmulator = createServerFn({ method: "POST" })
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
  .handler(async ({ data }) => {
    await checkAdmin();
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
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await checkAdmin();
    const { error } = await supabase
      .from('emulators')
      .delete()
      .eq('id', data.id);
    if (error) throw error;
    return { success: true };
  });
