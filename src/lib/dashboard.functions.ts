import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getUserDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const userEmail = claims.email;

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

  // 3. Get fleet counts and active missions for each farm
  const farmIds = farms.map(f => f.id);
  let fleetCounts: Record<string, number> = {};
  let activeMissions: Record<string, any> = {};

  if (farmIds.length > 0) {
    const [ { data: fleets }, { data: runs } ] = await Promise.all([
      supabase.from("fleets").select("farm_id").in("farm_id", farmIds),
      supabase.from("mission_runs")
        .select("*, missions(name)")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    ]);

    fleets?.forEach(fleet => {
      fleetCounts[fleet.farm_id] = (fleetCounts[fleet.farm_id] || 0) + 1;
    });

    runs?.forEach(run => {
      if (!activeMissions[run.farm_id]) {
        activeMissions[run.farm_id] = run;
      }
    });
  }

  // 4. Available Missions (based on the `missions` table)
  const { data: missions } = await supabase
    .from("missions")
    .select("id, name, description")
    .eq("status", "ACTIVE");

  return {
    user: {
      fullName: profile?.full_name || userEmail,
      email: userEmail,
    },
    stats: {
      totalFarms: farms.length,
      activeFarms: farms.filter(f => f.status === 'ACTIVE').length,
    },
    farms: farms.map(f => ({
      ...f,
      fleetCount: fleetCounts[f.id] || 0,
      activeMission: activeMissions[f.id] || null
    })),
    missions: missions || [],
    automationStatus: Object.keys(activeMissions).length > 0 ? "RUNNING" : "IDLE"
  };
});
