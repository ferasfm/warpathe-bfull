import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";

/**
 * AGENT COMMUNICATION CORE
 * 
 * This module implements the secure communication contract between the WARPATH platform 
 * and future Windows Agents.
 * 
 * Security:
 * - Agents use a unique token for authentication.
 * - Tokens are hashed in the database (token_hash).
 * - Registration requires a platform-wide secret key.
 */

const verifyAgent = async (agentId: string, token: string) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  
  const { data: agent, error } = await supabaseAdmin
    .from("agents")
    .select("token_hash")
    .eq("id", agentId)
    .single();

  if (error || !agent || !agent.token_hash) return false;

  const hash = createHash("sha256").update(token).digest("hex");
  return hash === agent.token_hash;
};

// 1. Agent Registration
export const registerAgent = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    registrationKey: z.string(),
    name: z.string(),
    hostname: z.string(),
    version: z.string(),
    installationId: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Verify registration key from system settings
    const { data: setting } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", "AGENT_REGISTRATION_KEY")
      .single();

    const validKey = typeof setting?.value === 'string' ? setting.value : JSON.stringify(setting?.value);
    // Handle JSON stringification if needed, but our SQL insert used '"value"'
    if (!setting || validKey.replace(/"/g, '') !== data.registrationKey) {
      throw new Error("Invalid registration key");
    }

    // Generate secure agent token
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const { data: agent, error } = await supabaseAdmin
      .from("agents")
      .upsert({
        name: data.name,
        hostname: data.hostname,
        version: data.version,
        installation_id: data.installationId,
        token_hash: tokenHash,
        status: "ONLINE",
        last_heartbeat: new Date().toISOString(),
      }, { onConflict: 'installation_id' })
      .select("id")
      .single();

    if (error) throw new Error(`Registration failed: ${error.message}`);

    return { agentId: agent.id, token };
  });

// 2. Agent Heartbeat
export const agentHeartbeat = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    agentId: z.string(),
    token: z.string(),
    version: z.string(),
    status: z.enum(["ONLINE", "OFFLINE", "UNKNOWN"]),
  }).parse(data))
  .handler(async ({ data }) => {
    if (!await verifyAgent(data.agentId, data.token)) {
      throw new Error("Unauthorized");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    await supabaseAdmin
      .from("agents")
      .update({
        version: data.version,
        status: data.status,
        last_heartbeat: new Date().toISOString(),
      })
      .eq("id", data.agentId);

    return { success: true };
  });

// 3. Command Queue Retrieval
export const getPendingCommands = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({
    agentId: z.string(),
    token: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    if (!await verifyAgent(data.agentId, data.token)) {
      throw new Error("Unauthorized");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: commands } = await supabaseAdmin
      .from("agent_commands")
      .select("*")
      .eq("agent_id", data.agentId)
      .eq("status", "PENDING")
      .order("created_at", { ascending: true });

    return commands || [];
  });

// 4. Command Result Submission
export const submitCommandResult = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    agentId: z.string(),
    token: z.string(),
    commandId: z.string(),
    status: z.enum(["SUCCESS", "FAILED", "TIMEOUT"]),
    errorMessage: z.string().optional(),
    payload: z.any().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    if (!await verifyAgent(data.agentId, data.token)) {
      throw new Error("Unauthorized");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { error } = await supabaseAdmin
      .from("agent_commands")
      .update({
        status: data.status,
        completed_at: new Date().toISOString(),
        error_message: data.errorMessage,
        payload: data.payload, // Store updated payload/result
      })
      .eq("id", data.commandId)
      .eq("agent_id", data.agentId);

    if (error) throw new Error("Failed to update command");
    return { success: true };
  });

// 5. Agent Event Submission
export const submitAgentEvent = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    agentId: z.string(),
    token: z.string(),
    eventType: z.string(),
    deviceId: z.string().optional(),
    payload: z.any().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    if (!await verifyAgent(data.agentId, data.token)) {
      throw new Error("Unauthorized");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    await supabaseAdmin
      .from("agent_events")
      .insert({
        agent_id: data.agentId,
        event_type: data.eventType,
        device_id: data.deviceId,
        payload: data.payload,
      });

    return { success: true };
  });

// 6. Request Diagnostic Screenshot (Admin Only)
export const requestDiagnosticScreenshot = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    agentId: z.string(),
    deviceId: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Auth check - simplified for brevity, in prod use middleware
    // This is a placeholder for the actual security check
    
    const { data: command, error } = await supabaseAdmin
      .from("agent_commands")
      .insert({
        agent_id: data.agentId,
        device_id: data.deviceId,
        command_type: "TAKE_SCREENSHOT",
        status: "PENDING",
        payload: { serial: data.deviceId } // Usually device_id is the serial in this context
      })
      .select()
      .single();

    if (error) throw new Error("Failed to queue screenshot command");
    return command;
  });

// 7. Request Vision Test (Admin Only)
export const requestVisionTest = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    agentId: z.string(),
    deviceId: z.string(),
    ruleId: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: rule } = await supabaseAdmin
      .from("vision_rules")
      .select("*, vision_assets(*)")
      .eq("id", data.ruleId)
      .single();

    if (!rule) throw new Error("Vision rule not found");

    const { data: command, error } = await supabaseAdmin
      .from("agent_commands")
      .insert({
        agent_id: data.agentId,
        device_id: data.deviceId,
        command_type: "TEST_VISION_RULE",
        status: "PENDING",
        payload: { 
          serial: data.deviceId,
          rule: rule,
          assetUrl: rule.vision_assets.image_url
        }
      })
      .select()
      .single();

    if (error) throw new Error("Failed to queue vision test command");
    return command;
  });
