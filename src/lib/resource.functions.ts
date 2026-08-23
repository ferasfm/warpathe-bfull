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

export const getResources = createServerFn({ method: "GET" }).handler(async () => {
  await checkAdmin();
  const { data, error } = await supabase
    .from("resources")
    .select("*, resource_assets(*)")
    .order("name");
  if (error) throw error;
  return data;
});

export const updateResource = createServerFn({ method: "POST" })
  .validator((data: { id: string, name?: string, status?: string }) => z.object({
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    status: z.string().optional()
  }).parse(data))
  .handler(async ({ data: { id, ...updates } }) => {
    await checkAdmin();
    const { data: result, error } = await supabase
      .from("resources")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const uploadResourceAsset = createServerFn({ method: "POST" })
  .validator((data: { resourceId: string, name: string, storagePath: string }) => z.object({
    resourceId: z.string().uuid(),
    name: z.string().min(1),
    storagePath: z.string().min(1)
  }).parse(data))
  .handler(async ({ data: { resourceId, name, storagePath } }) => {
    await checkAdmin();
    
    // First, deactivate existing assets for this resource
    await supabase
      .from("resource_assets")
      .update({ active: false })
      .eq("resource_id", resourceId);

    // Insert new asset
    const { data: result, error } = await supabase
      .from("resource_assets")
      .insert({
        resource_id: resourceId,
        name,
        storage_path: storagePath,
        active: true
      })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  });
