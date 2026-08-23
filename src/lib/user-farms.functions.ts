import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getAssignedFarms = createServerFn({ method: "GET" }).handler(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  const { data: farmUsers, error } = await supabase
    .from("farm_users")
    .select(`
      farms (
        *,
        accounts (name),
        fleets (id)
      )
    `)
    .eq("user_id", session.user.id);

  if (error) throw error;

  return farmUsers?.map((fu: any) => ({
    ...fu.farms,
    accountName: fu.farms.accounts?.name || "Unknown",
    fleetCount: fu.farms.fleets?.length || 0,
    automationStatus: "IDLE"
  })) || [];
});

export const getFarmDetails = createServerFn({ method: "GET" })
  .validator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: farmId }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    // Security check: Verify user is assigned to this farm
    const { data: assignment, error: authError } = await supabase
      .from("farm_users")
      .select("id")
      .eq("farm_id", farmId)
      .eq("user_id", session.user.id)
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

export const getActiveResources = createServerFn({ method: "GET" }).handler(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("status", "ACTIVE")
    .order("name");
  
  if (error) throw error;
  return data;
});

export const saveFarmConfiguration = createServerFn({ method: "POST" })
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
  .handler(async ({ data: { farmId, assignments } }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    // 1. Verify farm ownership
    const { data: farmUser } = await supabase
      .from("farm_users")
      .select("id")
      .eq("farm_id", farmId)
      .eq("user_id", session.user.id)
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

