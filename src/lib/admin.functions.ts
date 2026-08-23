import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const getAdminStats = createServerFn({ method: "GET" }).handler(async () => {
  const [
    { count: users },
    { count: accounts },
    { count: farms },
    { count: fleets },
    { count: missions },
    { count: agents },
    { count: devices },
    { count: emulators },
    { count: onlineAgents },
    { count: offlineAgents },
    { count: activeMissions },
    { count: failedMissions },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("accounts").select("*", { count: "exact", head: true }),
    supabase.from("farms").select("*", { count: "exact", head: true }),
    supabase.from("fleets").select("*", { count: "exact", head: true }),
    supabase.from("missions").select("*", { count: "exact", head: true }),
    supabase.from("agents").select("*", { count: "exact", head: true }),
    supabase.from("devices").select("*", { count: "exact", head: true }),
    supabase.from("emulators").select("*", { count: "exact", head: true }),
    supabase.from("agents").select("*", { count: "exact", head: true }).gt("last_heartbeat", new Date(Date.now() - 5 * 60 * 1000).toISOString()),
    supabase.from("agents").select("*", { count: "exact", head: true }).lte("last_heartbeat", new Date(Date.now() - 5 * 60 * 1000).toISOString()),
    supabase.from("mission_runs").select("*", { count: "exact", head: true }).eq("status", "running"),
    supabase.from("mission_runs").select("*", { count: "exact", head: true }).eq("status", "failed"),
  ]);

  return {
    users,
    accounts,
    farms,
    fleets,
    missions,
    agents,
    devices,
    emulators,
    onlineAgents,
    offlineAgents,
    activeMissions,
    failedMissions,
  };
});
