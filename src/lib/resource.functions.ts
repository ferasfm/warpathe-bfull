import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkRole } from "./rbac.server";

export const getResources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ["admin", "super_admin"]);
    const { data, error } = await supabase
      .from("resources")
      .select("*, resource_assets(*)")
      .order("name");
    if (error) throw error;
    return data;
  });

export const updateResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; name?: string; status?: string }) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        status: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data: { id, ...updates }, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ["admin", "super_admin"]);
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
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { resourceId: string; name: string; storagePath: string }) =>
    z
      .object({
        resourceId: z.string().uuid(),
        name: z.string().min(1),
        storagePath: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data: { resourceId, name, storagePath }, context }) => {
    const { supabase, userId } = context;
    await checkRole(supabase, userId, ["admin", "super_admin"]);

    await supabase
      .from("resource_assets")
      .update({ active: false })
      .eq("resource_id", resourceId);

    const { data: result, error } = await supabase
      .from("resource_assets")
      .insert({
        resource_id: resourceId,
        name,
        storage_path: storagePath,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  });
