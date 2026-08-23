import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const getAuditLogs = createServerFn({ method: "GET" })
  .validator(z.object({
    page: z.number().default(1),
    limit: z.number().default(20),
    action: z.string().optional(),
    entityType: z.string().optional(),
    userEmail: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    let query = supabase.from("audit_logs").select("*", { count: "exact" });
    
    if (data.action) query = query.eq("action", data.action);
    if (data.entityType) query = query.eq("entity_type", data.entityType);
    
    const from = (data.page - 1) * data.limit;
    const to = from + data.limit - 1;
    
    const { data: logs, count, error } = await query
      .range(from, to)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { logs, count };
  });

export const getAgentEvents = createServerFn({ method: "GET" })
  .validator(z.object({
    page: z.number().default(1),
    limit: z.number().default(20),
  }))
  .handler(async ({ data }) => {
    const from = (data.page - 1) * data.limit;
    const to = from + data.limit - 1;
    
    const { data: events, count, error } = await supabase
      .from("agent_events")
      .select("*", { count: "exact" })
      .range(from, to)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { events, count };
  });

export const getSystemSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .order("key");
  if (error) throw error;
  return data;
});

export const updateSystemSetting = createServerFn({ method: "POST" })
  .validator(z.object({
    id: z.string().optional(),
    key: z.string(),
    value: z.any(),
    description: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    if (data.id) {
      const { error } = await supabase
        .from("system_settings")
        .update({ 
          value: data.value, 
          description: data.description, 
          updated_at: new Date().toISOString(),
          updated_by: session.user.id 
        })
        .eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("system_settings")
        .insert({ 
          key: data.key, 
          value: data.value, 
          description: data.description, 
          updated_by: session.user.id 
        });
      if (error) throw error;
    }
    return { success: true };
  });
