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

// MISSIONS
export const getMissions = createServerFn({ method: "GET" }).handler(async () => {
  await checkAdmin();
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const createMission = createServerFn({ method: "POST" })
  .validator((data: { name: string, description?: string, status?: string }) => z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    status: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    await checkAdmin();
    const { data: result, error } = await supabase
      .from("missions")
      .insert({ ...data, version: "1.0.0" })
      .select()
      .single();
    if (error) throw error;
    
    // Auto-create first template version
    await supabase.from("mission_templates").insert({
        mission_id: result.id,
        version: "1.0.0",
        status: "draft"
    });

    return result;
  });

export const getMissionDetails = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: { id } }) => {
    await checkAdmin();
    const { data, error } = await supabase
      .from("missions")
      .select("*, mission_templates(*, mission_steps(*))")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  });

// TEMPLATES
export const publishTemplate = createServerFn({ method: "POST" })
  .validator((data: { templateId: string, missionId: string }) => z.object({
    templateId: z.string().uuid(),
    missionId: z.string().uuid()
  }).parse(data))
  .handler(async ({ data: { templateId, missionId } }) => {
    await checkAdmin();
    
    // Deactivate others
    await supabase
      .from("mission_templates")
      .update({ status: "archived" })
      .eq("mission_id", missionId);

    // Publish this one
    const { data: template, error } = await supabase
      .from("mission_templates")
      .update({ status: "published" })
      .eq("id", templateId)
      .select()
      .single();
    
    if (error) throw error;

    // Update main mission version
    await supabase
      .from("missions")
      .update({ version: template.version, status: "active" })
      .eq("id", missionId);

    return template;
  });

// STEPS
export const upsertMissionStep = createServerFn({ method: "POST" })
  .validator((data: { 
    id?: string,
    mission_template_id: string,
    name: string,
    step_type: string,
    step_order: number,
    configuration?: any,
    timeout_ms?: number,
    retry_count?: number
  }) => z.object({
    id: z.string().uuid().optional(),
    mission_template_id: z.string().uuid(),
    name: z.string().min(1),
    step_type: z.string(),
    step_order: z.number().int(),
    configuration: z.any().optional(),
    timeout_ms: z.number().int().optional(),
    retry_count: z.number().int().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    await checkAdmin();
    const { data: result, error } = await supabase
      .from("mission_steps")
      .upsert(data)
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const deleteMissionStep = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: { id } }) => {
    await checkAdmin();
    const { error } = await supabase.from("mission_steps").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  });

// RUNS
export const getMissionRuns = createServerFn({ method: "GET" }).handler(async () => {
    await checkAdmin();
    const { data, error } = await supabase
        .from("mission_runs")
        .select("*, missions(name), farms(name)")
        .order("created_at", { ascending: false })
        .limit(50);
    if (error) throw error;
    return data;
});
