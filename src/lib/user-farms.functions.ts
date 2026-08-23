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
            resources (name, code)
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
