// Admin-only user management: create a user, reset a password, or activate/deactivate an
// account. These are the only operations in this app that need the Supabase service-role key —
// creating/disabling a real auth.users row can't be done with the public anon key the browser
// carries, and the service-role key must never reach the browser. It lives only here, as a
// Supabase project secret (SUPABASE_SERVICE_ROLE_KEY), read server-side.
//
// Every call must be authenticated AND resolve to an `app_users` row with role = 'admin' —
// checked here in code, not left to RLS, since the service-role client bypasses RLS entirely.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_PASSWORD = "prokhas";
// A fixed deactivation window stood in for Supabase's admin "ban" mechanism, rather than a true
// permanent ban (GoTrue caps a single ban_duration) — long enough that only a deliberate
// reactivation (ban_duration: "none") ever lifts it.
const DEACTIVATE_DURATION = "87600h";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ ok: false, error: "Not signed in." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Resolve the caller from their own access token (the client attaches it automatically via
  // supabase.functions.invoke) and confirm they're an active admin before anything privileged.
  const { data: callerAuth, error: callerAuthError } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (callerAuthError || !callerAuth.user) return json({ ok: false, error: "Not signed in." }, 401);

  const { data: callerRow } = await admin
    .from("app_users")
    .select("role, active")
    .eq("auth_user_id", callerAuth.user.id)
    .maybeSingle();
  if (!callerRow || !callerRow.active || callerRow.role !== "admin") {
    return json({ ok: false, error: "System Administrator only." }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }
  const action = body.action as string | undefined;

  try {
    if (action === "create_user") {
      const { username, displayName, email, role, assignedModule, homeEntity } = body as {
        username?: string; displayName?: string; email?: string; role?: string; assignedModule?: string | null; homeEntity?: string;
      };
      if (!username || !displayName || !email || !role || !homeEntity) {
        return json({ ok: false, error: "username, displayName, email, role and homeEntity are all required." }, 400);
      }
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
      });
      if (createError || !created.user) return json({ ok: false, error: createError?.message ?? "Couldn't create the account." }, 400);

      const { error: insertError } = await admin.from("app_users").insert({
        id: username,
        display_name: displayName,
        role,
        home_entity: homeEntity,
        assigned_module: assignedModule ?? null,
        email,
        auth_user_id: created.user.id,
        must_change_password: true,
        active: true,
      });
      if (insertError) {
        // Roll back the auth user so a failed app_users insert (e.g. duplicate username) doesn't
        // leave an orphaned auth account with no corresponding row.
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ ok: false, error: insertError.message }, 400);
      }
      return json({ ok: true });
    }

    if (action === "update_user") {
      // Role/pillar/entity edits also go through here rather than a direct client-side table
      // update — app_users only grants a signed-in user UPDATE on their own must_change_password
      // column (migration 0020); Postgres column grants aren't scoped per-RLS-policy, so a second,
      // broader "admins can edit any row" policy would risk that same grant covering a non-admin's
      // self-update too. Routing every other field through this already-audited, service-role path
      // keeps that privileged surface in one place.
      const { username, role, assignedModule, homeEntity } = body as {
        username?: string; role?: string; assignedModule?: string | null; homeEntity?: string;
      };
      if (!username || !role || !homeEntity) return json({ ok: false, error: "username, role and homeEntity are required." }, 400);
      const { error: updateError } = await admin
        .from("app_users")
        .update({ role, assigned_module: assignedModule ?? null, home_entity: homeEntity })
        .eq("id", username);
      if (updateError) return json({ ok: false, error: updateError.message }, 400);
      return json({ ok: true });
    }

    if (action === "reset_password") {
      const { username } = body as { username?: string };
      if (!username) return json({ ok: false, error: "username is required." }, 400);
      const { data: row } = await admin.from("app_users").select("auth_user_id").eq("id", username).maybeSingle();
      if (!row?.auth_user_id) return json({ ok: false, error: "No such user." }, 404);
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(row.auth_user_id, { password: DEFAULT_PASSWORD });
      if (updateAuthError) return json({ ok: false, error: updateAuthError.message }, 400);
      const { error: updateRowError } = await admin.from("app_users").update({ must_change_password: true }).eq("id", username);
      if (updateRowError) return json({ ok: false, error: updateRowError.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_active") {
      const { username, active } = body as { username?: string; active?: boolean };
      if (!username || typeof active !== "boolean") return json({ ok: false, error: "username and active are required." }, 400);
      const { data: row } = await admin.from("app_users").select("auth_user_id").eq("id", username).maybeSingle();
      if (!row?.auth_user_id) return json({ ok: false, error: "No such user." }, 404);
      const { error: banError } = await admin.auth.admin.updateUserById(row.auth_user_id, {
        ban_duration: active ? "none" : DEACTIVATE_DURATION,
      });
      if (banError) return json({ ok: false, error: banError.message }, 400);
      const { error: updateRowError } = await admin.from("app_users").update({ active }).eq("id", username);
      if (updateRowError) return json({ ok: false, error: updateRowError.message }, 400);
      return json({ ok: true });
    }

    return json({ ok: false, error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : "Unexpected error." }, 500);
  }
});
