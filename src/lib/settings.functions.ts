import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const siteSettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
});

export const updateSiteSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => siteSettingSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Verify caller is super_admin
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isAdmin) throw new Error("غير مصرح");

    const { error } = await context.supabase
      .from("site_settings")
      .upsert({
        key: data.key,
        value: data.value,
        updated_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
    return { success: true };
  });
