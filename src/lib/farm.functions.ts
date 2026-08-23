import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Helper to check admin role
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

// ACCOUNTS
export const getAccounts = createServerFn({ method: "GET" }).handler(async () => {
  await checkAdmin();
  const { data, error } = await supabase.from("accounts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createAccount = createServerFn({ method: "POST" })
  .validator((data: { name: string, notes?: string, status?: string }) => z.object({
    name: z.string().min(1),
    notes: z.string().optional(),
    status: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    await checkAdmin();
    const { data: result, error } = await supabase.from("accounts").insert(data).select().single();
    if (error) throw error;
    return result;
  });

export const updateAccount = createServerFn({ method: "POST" })
  .validator((data: { id: string, name?: string, notes?: string, status?: string }) => z.object({
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    notes: z.string().optional(),
    status: z.string().optional()
  }).parse(data))
  .handler(async ({ data: { id, ...updates } }) => {
    await checkAdmin();
    const { data: result, error } = await supabase.from("accounts").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return result;
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: { id } }) => {
    await checkAdmin();
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  });

// FARMS
export const getFarms = createServerFn({ method: "GET" }).handler(async () => {
  await checkAdmin();
  const { data, error } = await supabase
    .from("farms")
    .select("*, accounts(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createFarm = createServerFn({ method: "POST" })
  .validator((data: { name: string, account_id: string, notes?: string, status?: string }) => z.object({
    name: z.string().min(1),
    account_id: z.string().uuid(),
    notes: z.string().optional(),
    status: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    await checkAdmin();
    const { data: result, error } = await supabase.from("farms").insert(data).select().single();
    if (error) throw error;
    return result;
  });

export const updateFarm = createServerFn({ method: "POST" })
  .validator((data: { id: string, name?: string, account_id?: string, notes?: string, status?: string }) => z.object({
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    account_id: z.string().uuid().optional(),
    notes: z.string().optional(),
    status: z.string().optional()
  }).parse(data))
  .handler(async ({ data: { id, ...updates } }) => {
    await checkAdmin();
    const { data: result, error } = await supabase.from("farms").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return result;
  });

export const deleteFarm = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: { id } }) => {
    await checkAdmin();
    const { error } = await supabase.from("farms").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  });

// USER ASSIGNMENTS
export const getFarmUsers = createServerFn({ method: "GET" })
  .validator((data: { farmId: string }) => z.object({ farmId: z.string().uuid() }).parse(data))
  .handler(async ({ data: { farmId } }) => {
    await checkAdmin();
    const { data, error } = await supabase
      .from("farm_users")
      .select("*, profiles(full_name, email)")
      .eq("farm_id", farmId);
    if (error) throw error;
    return data;
  });

export const assignUserToFarm = createServerFn({ method: "POST" })
  .validator((data: { farmId: string, userId: string }) => z.object({
    farmId: z.string().uuid(),
    userId: z.string().uuid()
  }).parse(data))
  .handler(async ({ data: { farmId, userId } }) => {
    await checkAdmin();
    const { data: result, error } = await supabase.from("farm_users").insert({ farm_id: farmId, user_id: userId }).select().single();
    if (error) {
        if (error.code === '23505') throw new Error("User is already assigned to this farm");
        throw error;
    }
    return result;
  });

export const removeUserFromFarm = createServerFn({ method: "POST" })
  .validator((data: { assignmentId: string }) => z.object({ assignmentId: z.string().uuid() }).parse(data))
  .handler(async ({ data: { assignmentId } }) => {
    await checkAdmin();
    const { error } = await supabase.from("farm_users").delete().eq("id", assignmentId);
    if (error) throw error;
    return { success: true };
  });
