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

export const getFleetsByFarm = createServerFn({ method: "GET" })
  .validator((data: { farmId: string }) => z.object({ farmId: z.string().uuid() }).parse(data))
  .handler(async ({ data: { farmId } }) => {
    await checkAdmin();
    const { data, error } = await supabase
      .from("fleets")
      .select("*, fleet_assignments(*, resources(name))")
      .eq("farm_id", farmId)
      .order("fleet_number");
    if (error) throw error;
    return data;
  });

export const createOrUpdateFleet = createServerFn({ method: "POST" })
  .validator((data: { 
    id?: string, 
    farm_id: string, 
    fleet_number: number, 
    name?: string, 
    status?: string 
  }) => z.object({
    id: z.string().uuid().optional(),
    farm_id: z.string().uuid(),
    fleet_number: z.number().int().min(1),
    name: z.string().optional(),
    status: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    await checkAdmin();

    // Check for duplicate fleet_number in the same farm
    const query = supabase
      .from("fleets")
      .select("id")
      .eq("farm_id", data.farm_id)
      .eq("fleet_number", data.fleet_number);
    
    if (data.id) {
      query.neq("id", data.id);
    }

    const { data: existing } = await query;
    if (existing && existing.length > 0) {
      throw new Error(`Fleet number ${data.fleet_number} already exists in this farm`);
    }

    if (data.id) {
      const { data: result, error } = await supabase
        .from("fleets")
        .update(data)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw error;
      return result;
    } else {
      const { data: result, error } = await supabase
        .from("fleets")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  });

export const assignResourceToFleet = createServerFn({ method: "POST" })
  .validator((data: { 
    fleetId: string, 
    farmId: string, 
    resourceId: string 
  }) => z.object({
    fleetId: z.string().uuid(),
    farmId: z.string().uuid(),
    resourceId: z.string().uuid()
  }).parse(data))
  .handler(async ({ data: { fleetId, farmId, resourceId } }) => {
    await checkAdmin();

    // Upsert assignment (assuming one resource per fleet as per requirement)
    const { data: result, error } = await supabase
      .from("fleet_assignments")
      .upsert({
        fleet_id: fleetId,
        farm_id: farmId,
        resource_id: resourceId,
        enabled: true
      }, { onConflict: "fleet_id" })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  });

export const deleteFleet = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: { id } }) => {
    await checkAdmin();
    const { error } = await supabase.from("fleets").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  });
