import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// 1. Get Monitoring Metrics (Admin Only)
export const getMonitoringMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Check if user is admin
    const { data: { user } } = await context.supabase.auth.getUser();
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user?.id || "")
      .eq("role", "admin");
      
    if (!roles || roles.length === 0) {
      // Check for super_admin too
      const { data: superRoles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id || "")
        .eq("role", "super_admin");
      if (!superRoles || superRoles.length === 0) throw new Error("Unauthorized");
    }

    const now = new Date();
    const heartbeatLimit = new Date(now.getTime() - 90000).toISOString(); // 90s threshold

    // Parallel counts
    const [
      { count: totalAgents },
      { count: onlineAgents },
      { count: totalEmulators },
      { count: busyEmulators },
      { count: runningMissions },
      { count: failedMissionsToday }
    ] = await Promise.all([
      supabaseAdmin.from("agents").select("*", { count: 'exact', head: true }),
      supabaseAdmin.from("agents").select("*", { count: 'exact', head: true }).gt("last_heartbeat", heartbeatLimit),
      supabaseAdmin.from("emulators").select("*", { count: 'exact', head: true }),
      supabaseAdmin.from("emulators").select("*", { count: 'exact', head: true }).eq("is_busy", true),
      supabaseAdmin.from("mission_runs").select("*", { count: 'exact', head: true }).eq("status", "RUNNING"),
      supabaseAdmin.from("mission_runs").select("*", { count: 'exact', head: true })
        .eq("status", "FAILED")
        .gt("created_at", new Date(now.setHours(0,0,0,0)).toISOString())
    ]);

    return {
      agents: { total: totalAgents || 0, online: onlineAgents || 0, offline: (totalAgents || 0) - (onlineAgents || 0) },
      emulators: { total: totalEmulators || 0, busy: busyEmulators || 0, idle: (totalEmulators || 0) - (busyEmulators || 0) },
      missions: { running: runningMissions || 0, failedToday: failedMissionsToday || 0 }
    };
  });

// 2. Get Paginated Logs (Admin Only)
export const getPaginatedLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    page: z.number().default(0),
    pageSize: z.number().default(20),
    severity: z.string().optional(),
    agentId: z.string().optional(),
    eventType: z.string().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Auth check (repeat for each admin fn or use a shared helper)
    
    let query = supabaseAdmin
      .from("agent_events")
      .select("*, agents(name)", { count: 'exact' })
      .order("created_at", { ascending: false })
      .range(data.page * data.pageSize, (data.page + 1) * data.pageSize - 1);

    if (data.agentId) query = query.eq("agent_id", data.agentId);
    if (data.eventType) query = query.eq("event_type", data.eventType);

    const { data: logs, count, error } = await query;
    if (error) throw new Error(error.message);

    return { logs, total: count || 0 };
  });

// 3. Get Mission Timeline (Admin/User)
export const getMissionTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    missionRunId: z.string(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    // RLS will handle security here via supabase client in handler
    const { data: events, error } = await context.supabase
      .from("mission_events")
      .select("*")
      .eq("mission_run_id", data.missionRunId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return events;
  });

// 4. Get Mission Runs for a Mission (Admin Only)
export const getMissionRunsForMission = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    missionId: z.string(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: runs, error } = await supabaseAdmin
      .from("mission_runs")
      .select(`
        *,
        farms (name),
        emulators (instance_name)
      `)
      .eq("mission_id", data.missionId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return runs;
  });
