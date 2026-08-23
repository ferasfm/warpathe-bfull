import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "crypto";

const AiVisionResultSchema = z.object({
  detected: z.boolean(),
  confidence: z.number().min(0).max(1),
  coordinates: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  objects: z.array(z.string()),
  error: z.string().optional()
});

export type AiVisionResult = z.infer<typeof AiVisionResultSchema>;

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

export const processAiVision = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({
    agentId: z.string(),
    token: z.string(),
    deviceId: z.string(),
    missionRunId: z.string().optional(),
    screenshot: z.string(), // base64
    prompt: z.string(),
    context: z.any().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const startTime = Date.now();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Verify Agent
    if (!await verifyAgent(data.agentId, data.token)) {
      throw new Error("Unauthorized agent");
    }

    // 2. Fetch Config & Check Global Toggle
    const { data: settings } = await supabaseAdmin
      .from("system_settings")
      .select("key, value");
    
    const getConfig = (key: string) => {
      const s = settings?.find(i => i.key === key);
      try {
        return typeof s?.value === 'string' ? JSON.parse(s.value) : s?.value;
      } catch {
        return s?.value;
      }
    };

    if (getConfig("AI_VISION_ENABLED") !== true) {
      throw new Error("AI_VISION_DISABLED");
    }

    const provider = getConfig("AI_VISION_PROVIDER") || "lovable";
    const model = getConfig("AI_VISION_MODEL") || "gpt-4o";
    const maxCallsPerMission = parseInt(getConfig("AI_VISION_MAX_CALLS_PER_MISSION") || "10");
    const maxCallsPerDeviceHour = parseInt(getConfig("AI_VISION_MAX_CALLS_PER_DEVICE_HOUR") || "50");
    const timeoutMs = parseInt(getConfig("AI_VISION_TIMEOUT_MS") || "30000");

    // 3. Rate Limiting Check
    if (data.missionRunId) {
      const { count: missionCalls } = await supabaseAdmin
        .from("ai_vision_logs")
        .select("*", { count: 'exact', head: true })
        .eq("mission_run_id", data.missionRunId);
      
      if ((missionCalls || 0) >= maxCallsPerMission) {
        throw new Error("MISSION_LIMIT_EXCEEDED");
      }
    }

    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count: deviceCalls } = await supabaseAdmin
      .from("ai_vision_logs")
      .select("*", { count: 'exact', head: true })
      .eq("device_id", data.deviceId)
      .gt("created_at", oneHourAgo);

    if ((deviceCalls || 0) >= maxCallsPerDeviceHour) {
      throw new Error("DEVICE_RATE_LIMIT_EXCEEDED");
    }

    let visionResult: AiVisionResult;

    try {
      // 4. AI Gateway Call
      const { aiGateway } = await import("@/lib/ai-gateway.server"); // We'll create this helper
      
      const systemPrompt = `You are the Vision Engine for WARPATH, an automation platform. 
Your task is to analyze the provided screenshot and return a JSON object.
Target screen resolution: 1012x800.
Strictly return ONLY JSON in this format:
{
  "detected": boolean,
  "confidence": number (0-1),
  "coordinates": { "x": number, "y": number },
  "objects": string[],
  "error": string (optional)
}
User instruction: ${data.prompt}`;

      const response = await aiGateway.chat({
        provider,
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: "Analyze this image based on the prompt." },
              { type: "image_url", image_url: { url: `data:image/png;base64,${data.screenshot}` } }
            ] 
          }
        ],
        temperature: 0,
        response_format: { type: "json_object" },
        timeout: timeoutMs
      });

      visionResult = AiVisionResultSchema.parse(JSON.parse(response.content));
    } catch (err: any) {
      visionResult = {
        detected: false,
        confidence: 0,
        objects: [],
        error: err.message
      };
    }

    // 5. Audit Logging
    await supabaseAdmin
      .from("ai_vision_logs")
      .insert({
        agent_id: data.agentId,
        device_id: data.deviceId,
        mission_run_id: data.missionRunId,
        provider,
        model,
        prompt: data.prompt,
        result: visionResult,
        confidence: visionResult.confidence,
        processing_time_ms: Date.now() - startTime,
        error: visionResult.error
      });

    return visionResult;
  });
