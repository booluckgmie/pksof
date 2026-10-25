// Replaces src/lib/api/activity.ts. fetchActivityEvents keeps the same signature.
// logLogin is kept for API compatibility but is no longer called from session.tsx's new
// login() — the new POST /api/auth/login endpoint logs the activity row itself, server-side,
// in the same request (see server/src/routes/auth.ts), so there's no separate client-side
// write to make anymore.
import { apiFetch } from "@/lib/apiClient";
import type { EntityId, Role } from "@/types";

export interface ActivityEvent {
  id: string; userName: string; role: Role; entityId: EntityId | null; action: "login"; detail: string | null; createdAt: string;
}

interface ActivityEventDbRow {
  id: string; user_name: string; role: string; entity_id: string | null; action: string; detail: string | null; created_at: string;
}

const toEvent = (r: ActivityEventDbRow): ActivityEvent => ({
  id: r.id, userName: r.user_name, role: r.role as Role, entityId: r.entity_id as EntityId | null,
  action: r.action as ActivityEvent["action"], detail: r.detail, createdAt: r.created_at,
});

export async function fetchActivityEvents(): Promise<ActivityEvent[]> {
  return (await apiFetch<ActivityEventDbRow[]>("/activity")).map(toEvent);
}

/** @deprecated no longer called — see the file header note. Kept only so nothing breaks if
 * some other call site is added later; it's a harmless no-op today since nothing imports it. */
export function logLogin(_input: { userName: string; role: Role; entityId: EntityId; detail?: string }): void {
  // Intentionally empty — see header comment.
}
