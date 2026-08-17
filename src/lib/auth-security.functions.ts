import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

function getClientIp() {
  const request = getRequest();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

export const trackLoginAttempt = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ is_successful: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = getClientIp();

    const { error } = await supabaseAdmin.from("login_attempts").insert({
      ip_address: ip,
      is_successful: data.is_successful,
    });

    if (error) {
      console.error("Failed to track login attempt:", error);
      throw new Error("Internal Server Error");
    }

    return { ip };
  });

export const checkIpStatus = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = getClientIp();

    if (ip === "unknown") return { isBlocked: false, ip };

    const { data, error } = await supabaseAdmin.rpc("check_ip_blocked", { _ip: ip });
    
    if (error) {
      console.error("Failed to check IP status:", error);
      // Fail open to avoid locking everyone out if there's a DB issue, 
      // but log it prominently.
      return { isBlocked: false, ip };
    }

    return { isBlocked: !!data, ip };
  });
