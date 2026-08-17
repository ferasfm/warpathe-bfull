import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const updateSiteSetting = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string; value: any }) => d)
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { success: true };
  });
