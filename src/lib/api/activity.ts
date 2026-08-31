import { getSupabase } from "@/lib/supabase";
import type { EntityId, Role } from "@/types";

export interface ActivityEvent {
  id: string;
  userName: string;
  role: Role;
  entityId: EntityId | null;
  action: "login";
  detail: string | null;
  createdAt: string;
}

interface ActivityEventDbRow {
  id: string;
  user_name: string;
  role: string;
  entity_id: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

function toEvent(row: ActivityEventDbRow): ActivityEvent {
  return {
    id: row.id,
    userName: row.user_name,
    role: row.role as Role,
    entityId: row.entity_id as EntityId | null,
    action: row.action as ActivityEvent["action"],
    detail: row.detail,
    createdAt: row.created_at,
  };
}

export async function fetchActivityEvents(): Promise<ActivityEvent[]> {
  const { data, error } = await getSupabase().from("activity_log").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) throw error;
  return (data as ActivityEventDbRow[]).map(toEvent);
}

/** Fire-and-forget — a failed activity-log write should never block sign-in itself. */
export function logLogin(input: { userName: string; role: Role; entityId: EntityId; detail?: string }): void {
  const id = `LOGIN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  getSupabase()
    .from("activity_log")
    .insert({
      id,
      user_name: input.userName,
      role: input.role,
      entity_id: input.entityId,
      action: "login",
      detail: input.detail ?? null,
    })
    .then(({ error }) => {
      if (error) console.warn("activity log write failed:", error.message);
    });
}
