import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Maps the "admin" username to the super admin account email, server-side only.
const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "iitalhuda@gmail.com";

function keyFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export const adminUsernameSignIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ username: z.string().trim().min(1).max(64), password: z.string().min(1).max(256) }).parse(d),
  )
  .handler(async ({ data }) => {
    if (data.username.toLowerCase() !== ADMIN_USERNAME) {
      return { ok: false as const, error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
    }
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const client = createClient(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: { fetch: keyFetch(key) },
    });
    const { data: res, error } = await client.auth.signInWithPassword({ email: ADMIN_EMAIL, password: data.password });
    if (error || !res.session) {
      return { ok: false as const, error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
    }
    return {
      ok: true as const,
      access_token: res.session.access_token,
      refresh_token: res.session.refresh_token,
    };
  });
