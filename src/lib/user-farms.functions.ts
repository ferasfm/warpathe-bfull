import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAssignedFarms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

  const { data: farmUsers, error } = await supabase
    .from("farm_users")
    .select(`
      farms (
        *,
        accounts (name),
        fleets (id)
      )
    `)
    .eq("user_id", userId);

  if (error) throw error;

  return farmUsers?.map((fu: any) => ({
    ...fu.farms,
    accountName: fu.farms.accounts?.name || "Unknown",
    fleetCount: fu.farms.fleets?.length || 0,
    automationStatus: "IDLE"
  })) || [];
});

export const getFarmDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: farmId, context }) => {
    const { supabase, userId } = context;

    // Security check: Verify user is assigned to this farm
    const { data: assignment, error: authError } = await supabase
      .from("farm_users")
      .select("id")
      .eq("farm_id", farmId)
      .eq("user_id", userId)
      .single();

    if (authError || !assignment) {
      throw new Error("Farm not found or access denied");
    }

    // Fetch details
    const { data: farm, error } = await supabase
      .from("farms")
      .select(`
        *,
        accounts (name),
        fleets (
          *,
          fleet_assignments (
            *,
            resources (id, name, code)
          )
        )
      `)
      .eq("id", farmId)
      .single();

    if (error) throw error;

    return {
      ...farm,
      accountName: (farm as any).accounts?.name || "Unknown",
      fleets: (farm as any).fleets || [],
      automationStatus: "IDLE"
    };
  });

export const getActiveResources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("status", "ACTIVE")
    .order("name");
  
  if (error) throw error;
  return data;
});

export const saveFarmConfiguration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { 
    farmId: string, 
    assignments: { fleetId: string, resourceId: string }[] 
  }) => z.object({
    farmId: z.string().uuid(),
    assignments: z.array(z.object({
      fleetId: z.string().uuid(),
      resourceId: z.string().uuid()
    }))
  }).parse(data))
  .handler(async ({ data: { farmId, assignments }, context }) => {
    const { supabase, userId } = context;

    // 1. Verify farm ownership
    const { data: farmUser } = await supabase
      .from("farm_users")
      .select("id")
      .eq("farm_id", farmId)
      .eq("user_id", userId)
      .single();

    if (!farmUser) throw new Error("Unauthorized: Farm access denied");

    // 2. Validate all fleets belong to the farm and resources exist
    const fleetIds = assignments.map(a => a.fleetId);
    const { data: validFleets } = await supabase
      .from("fleets")
      .select("id")
      .eq("farm_id", farmId)
      .in("id", fleetIds);

    if (!validFleets || validFleets.length !== fleetIds.length) {
      throw new Error("Invalid configuration: Some fleets do not belong to this farm");
    }

    // 3. Process assignments
    for (const assignment of assignments) {
      // Upsert fleet assignment
      const { error: upsertError } = await supabase
        .from("fleet_assignments")
        .upsert({
          farm_id: farmId,
          fleet_id: assignment.fleetId,
          resource_id: assignment.resourceId,
          enabled: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'farm_id,fleet_id'
        });

      if (upsertError) throw upsertError;
    }

    return { success: true };
  });

export const getUserTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

  // Get missions (runs) for farms assigned to the user
  const { data: farmUsers } = await supabase
    .from("farm_users")
    .select("farm_id")
    .eq("user_id", userId);

  const farmIds = farmUsers?.map(fu => fu.farm_id) || [];

  if (farmIds.length === 0) return [];

  const { data: runs, error } = await supabase
    .from("mission_runs")
    .select(`
      *,
      farms (name),
      missions (name)
    `)
    .in("farm_id", farmIds)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return runs?.map((run: any) => ({
    ...run,
    farmName: run.farms?.name || "Unknown",
    missionName: run.missions?.name || "Unknown Task"
  })) || [];
});
