import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiGateway } from "./ai-gateway.server";

const MissionStepSchema = z.object({
  order: z.number().int().min(1),
  action: z.enum(["WAIT", "SCREENSHOT", "FIND_IMAGE", "TAP", "CONDITION", "END"]),
  parameters: z.record(z.any()).optional(),
  name: z.string().optional(),
  timeout: z.number().int().optional(),
  retries: z.number().int().optional(),
  status: z.enum(["VALID", "REQUIRES_ASSET"]).optional(),
  asset_name: z.string().optional(),
});

const AiMissionDefinitionSchema = z.object({
  name: z.string().min(1),
  steps: z.array(MissionStepSchema),
});

export const generateMissionFromDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    description: z.string().min(5),
    missionId: z.string().uuid().optional(),
    templateId: z.string().uuid().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const startTime = Date.now();

    // 1. Check Admin Permission
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const roles = (roleData?.map(r => r.role) || []) as string[];
    if (!roles.includes('admin') && !roles.includes('super_admin')) {
      throw new Error("Forbidden: Admin access required");
    }

    // 2. Fetch Context (Vision Assets & Recovery Rules)
    const [assetsResult, rulesResult] = await Promise.all([
      supabase.from("vision_assets").select("id, name"),
      supabase.from("recovery_rules").select("id, name")
    ]);

    const visionAssets = assetsResult.data || [];
    const recoveryRules = rulesResult.data || [];

    // 3. AI Gateway Configuration
    const { data: settings } = await supabase
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

    const provider = getConfig("AI_MISSION_BUILDER_PROVIDER") || "lovable";
    const model = getConfig("AI_MISSION_BUILDER_MODEL") || "gpt-4o";
    const timeoutMs = parseInt(getConfig("AI_MISSION_BUILDER_TIMEOUT_MS") || "60000");

    let generatedMission: any = null;
    let errorMessage: string | null = null;

    try {
      const systemPrompt = `You are the AI Mission Builder for WARPATH. 
Your task is to convert a natural language description into a structured JSON mission definition.
Output MUST be strict JSON.

Rules:
1. Use ONLY these actions: WAIT, SCREENSHOT, FIND_IMAGE, TAP, CONDITION, END.
2. If an action or step is not supported, simplify or reject it.
3. Use existing Vision Assets if they match the description. Available assets: ${JSON.stringify(visionAssets)}.
4. If a required asset is missing, set "status": "REQUIRES_ASSET" and "asset_name": "...", but DO NOT invent an asset ID.
5. Parameters for actions:
   - WAIT: { "milliseconds": number }
   - FIND_IMAGE: { "asset": "ID or null", "threshold": number }
   - TAP: { "source": "previous_match" | "coordinates", "x": number, "y": number }
   - CONDITION: { "check": "IMAGE_EXISTS", "asset": "ID", "true_step": number, "false_step": number }
6. STRICTLY NO executable code, shell commands, or ADB calls.

Schema:
{
  "name": "Mission Name",
  "steps": [
    {
      "order": number,
      "action": "ACTION_TYPE",
      "parameters": {},
      "name": "Step Description",
      "timeout": ms,
      "retries": number
    }
  ]
}`;

      const response = await aiGateway.chat({
        provider,
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: data.description }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
        timeout: timeoutMs
      });

      const parsed = JSON.parse(response.content);
      generatedMission = AiMissionDefinitionSchema.parse(parsed);

      // Final security check - ensure no forbidden words in strings
      const forbidden = ["shell", "exec", "powershell", "javascript", "python", "adb"];
      const missionStr = JSON.stringify(generatedMission).toLowerCase();
      if (forbidden.some(word => missionStr.includes(word))) {
        throw new Error("Security Violation: Generated content contains forbidden command references.");
      }

    } catch (err: any) {
      errorMessage = err.message;
      throw new Error(`AI Mission Generation Failed: ${err.message}`);
    } finally {
      // 4. Audit Logging
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("ai_mission_generation_logs")
        .insert({
          admin_id: userId,
          prompt: data.description,
          generated_json: generatedMission,
          provider,
          model,
          status: errorMessage ? "failure" : "success",
          error_message: errorMessage
        });
    }

    return generatedMission;
  });
