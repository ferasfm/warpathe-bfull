import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const createManagerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
});

export const createManagerUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createManagerSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Verify caller is super_admin
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isAdmin) throw new Error("غير مصرح");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error(error.message);
    if (!created.user) throw new Error("فشل إنشاء الحساب");

    // Assign station_manager role
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "station_manager" });
    await supabaseAdmin.from("profiles").upsert({ id: created.user.id, email: data.email, full_name: data.full_name });

    return { id: created.user.id, email: data.email };
  });

const promoteAdminSchema = z.object({ email: z.string().email() });

export const promoteToSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => promoteAdminSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isAdmin) throw new Error("غير مصرح");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin.from("profiles").select("id").eq("email", data.email).maybeSingle();
    if (!prof) throw new Error("المستخدم غير موجود");
    await supabaseAdmin.from("user_roles").insert({ user_id: prof.id, role: "super_admin" }).select();
    return { ok: true };
  });

const bootstrapSchema = z.object({ email: z.string().email(), password: z.string().min(6), full_name: z.string().min(1) });

// Bootstrap: creates the very first super admin if none exists yet. Safe to leave enabled.
export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => bootstrapSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "super_admin");
    if ((count ?? 0) > 0) throw new Error("تم إنشاء الأدمن الرئيسي مسبقاً. سجّل الدخول من صفحة تسجيل الدخول.");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error(error.message);
    if (!created.user) throw new Error("فشل الإنشاء");
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "super_admin" });
    await supabaseAdmin.from("profiles").upsert({ id: created.user.id, email: data.email, full_name: data.full_name });
    return { ok: true };
  });
