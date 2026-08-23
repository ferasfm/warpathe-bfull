import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const getUserDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user.id;

  // 1. Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // 2. Get assigned farms (via farm_users)
  const { data: farmUsers, error: farmsError } = await supabase
    .from("farm_users")
    .select(`
      farm_id,
      farms (
        id,
        name,
        status,
        account_id,
        accounts (
          name
        )
      )
    `)
    .eq("user_id", userId);

  if (farmsError) throw farmsError;

  const farms = farmUsers?.map(fu => {
    const f = fu.farms as any;
    return {
      id: f.id,
      name: f.name,
      status: f.status,
      accountName: f.accounts?.name || 'Unknown',
      automationStatus: 'IDLE' // Default status per Phase 05A
    };
  }) || [];

  // 3. Get fleet counts for each farm
  const farmIds = farms.map(f => f.id);
  let fleetCounts: Record<string, number> = {};

  if (farmIds.length > 0) {
    const { data: fleets } = await supabase
      .from("fleets")
      .select("farm_id")
      .in("farm_id", farmIds);

    fleets?.forEach(fleet => {
      fleetCounts[fleet.farm_id] = (fleetCounts[fleet.farm_id] || 0) + 1;
    });
  }

  // 4. Available Mission Templates (Global or specific if implemented later)
  const { data: missions } = await supabase
    .from("mission_templates")
    .select("id, name, description")
    .eq("status", "ACTIVE");

  return {
    user: {
      fullName: profile?.full_name || session.user.email,
      email: session.user.email,
    },
    stats: {
      totalFarms: farms.length,
      activeFarms: farms.filter(f => f.status === 'ACTIVE').length,
    },
    farms: farms.map(f => ({
      ...f,
      fleetCount: fleetCounts[f.id] || 0
    })),
    missions: missions || [],
    automationStatus: "IDLE"
  };
});
