import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, KeyRound, Pencil, UserX, UserCheck } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { InfoNote } from "@/components/pk/Misc";
import { getSupabase } from "@/lib/supabase";
import { roleDefs } from "@/lib/roles";
import { entities } from "@/data/entities";
import { MODULE_LABEL } from "@/lib/modules";
import type { EntityId, Module, Role } from "@/types";
import type { ScreenId } from "@/lib/nav";

interface AppUserRow {
  id: string;
  display_name: string;
  role: Role;
  home_entity: EntityId;
  assigned_module: Module | null;
  email: string;
  must_change_password: boolean;
  active: boolean;
}

const EDITABLE_ROLES = roleDefs; // every role is assignable from here, including read-only ones

function emptyDraft() {
  return { username: "", displayName: "", email: "", role: "reporting_officer" as Role, homeEntity: "HQ" as EntityId, assignedModule: null as Module | null };
}

async function callManageUsers(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await getSupabase().functions.invoke("manage-users", { body });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export function AccessManagement({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const [rows, setRows] = useState<AppUserRow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ role: Role; homeEntity: EntityId; assignedModule: Module | null } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await getSupabase().from("app_users").select("*").order("display_name");
    if (error) { toast.error("Couldn't load users", { description: error.message }); return; }
    setRows((data ?? []) as AppUserRow[]);
  };

  useEffect(() => { load(); }, []);

  const availableModules = (entityId: EntityId) => entities.find((e) => e.id === entityId)?.modules ?? [];
  const roleDef = (role: Role) => roleDefs.find((r) => r.id === role)!;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.username.trim() || !draft.displayName.trim() || !draft.email.trim()) {
      toast.error("Name, username and email are all required.");
      return;
    }
    setSaving(true);
    const result = await callManageUsers({
      action: "create_user",
      username: draft.username.trim(),
      displayName: draft.displayName.trim(),
      email: draft.email.trim(),
      role: draft.role,
      homeEntity: draft.homeEntity,
      assignedModule: roleDef(draft.role).moduleLocked ? draft.assignedModule : null,
    });
    setSaving(false);
    if (!result.ok) { toast.error("Couldn't create user", { description: result.error }); return; }
    toast.success(`${draft.displayName} added — starts on the default password.`);
    setAdding(false);
    setDraft(emptyDraft());
    load();
  };

  const startEdit = (row: AppUserRow) => {
    setEditingId(row.id);
    setEditDraft({ role: row.role, homeEntity: row.home_entity, assignedModule: row.assigned_module });
  };

  const saveEdit = async (username: string) => {
    if (!editDraft) return;
    setBusyId(username);
    const result = await callManageUsers({
      action: "update_user",
      username,
      role: editDraft.role,
      homeEntity: editDraft.homeEntity,
      assignedModule: roleDef(editDraft.role).moduleLocked ? editDraft.assignedModule : null,
    });
    setBusyId(null);
    if (!result.ok) { toast.error("Couldn't update user", { description: result.error }); return; }
    toast.success("Updated");
    setEditingId(null);
    setEditDraft(null);
    load();
  };

  const handleResetPassword = async (row: AppUserRow) => {
    if (!window.confirm(`Reset ${row.display_name}'s password to the default? They'll be asked to set a new one at next sign-in.`)) return;
    setBusyId(row.id);
    const result = await callManageUsers({ action: "reset_password", username: row.id });
    setBusyId(null);
    if (!result.ok) { toast.error("Couldn't reset password", { description: result.error }); return; }
    toast.success(`${row.display_name}'s password was reset to the default.`);
    load();
  };

  const handleToggleActive = async (row: AppUserRow) => {
    const next = !row.active;
    if (!window.confirm(`${next ? "Reactivate" : "Deactivate"} ${row.display_name}?${next ? "" : " They won't be able to sign in until reactivated."}`)) return;
    setBusyId(row.id);
    const result = await callManageUsers({ action: "set_active", username: row.id, active: next });
    setBusyId(null);
    if (!result.ok) { toast.error("Couldn't update status", { description: result.error }); return; }
    toast.success(`${row.display_name} ${next ? "reactivated" : "deactivated"}.`);
    load();
  };

  return (
    <div>
      <ScreenHeader id="ACCESS_MGMT" subtitle="Users, roles and pillar access — System Administrator only." onNavigate={onNavigate} />

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[hsl(var(--pk-ink-faint))]">{rows ? `${rows.length} user${rows.length === 1 ? "" : "s"}` : "Loading…"}</p>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" /> Add user
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Name</span>
            <input value={draft.displayName} onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Username</span>
            <input value={draft.username} onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value.trim() }))} placeholder="e.g. nhba" className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Email</span>
            <input type="email" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value.trim() }))} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Role</span>
            <select value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as Role, assignedModule: null }))} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none">
              {EDITABLE_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Entity</span>
            <select value={draft.homeEntity} onChange={(e) => setDraft((d) => ({ ...d, homeEntity: e.target.value as EntityId, assignedModule: null }))} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none">
              {entities.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          </label>
          {roleDef(draft.role).moduleLocked && (
            <label className="flex flex-col gap-1">
              <span className="text-2xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Pillar</span>
              <select value={draft.assignedModule ?? availableModules(draft.homeEntity)[0]} onChange={(e) => setDraft((d) => ({ ...d, assignedModule: e.target.value as Module }))} className="rounded-md border border-[hsl(var(--pk-border))] px-2.5 py-1.5 text-sm bg-[hsl(var(--pk-surface))] outline-none">
                {availableModules(draft.homeEntity).map((m) => <option key={m} value={m}>{MODULE_LABEL[m]}</option>)}
              </select>
            </label>
          )}
          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create
            </button>
            <button type="button" onClick={() => { setAdding(false); setDraft(emptyDraft()); }} className="text-xs text-[hsl(var(--pk-ink-faint))] hover:text-[hsl(var(--pk-ink))] px-2">Cancel</button>
          </div>
        </form>
      )}

      <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-2xs uppercase tracking-wide text-white bg-[hsl(var(--pk-navy))]">
              <th className="text-left font-medium px-3 py-2.5">Name</th>
              <th className="text-left font-medium px-3 py-2.5">Username</th>
              <th className="text-left font-medium px-3 py-2.5">Role</th>
              <th className="text-left font-medium px-3 py-2.5">Pillar</th>
              <th className="text-left font-medium px-3 py-2.5">Status</th>
              <th className="text-right font-medium px-3 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((row) => {
              const isEditing = editingId === row.id;
              const busy = busyId === row.id;
              return (
                <tr key={row.id} className="border-t border-[hsl(var(--pk-border))]">
                  <td className="px-3 py-2.5 text-[hsl(var(--pk-ink))]">
                    {row.display_name}
                    <div className="text-2xs text-[hsl(var(--pk-ink-faint))]">{row.email}</div>
                  </td>
                  <td className="px-3 py-2.5 text-[hsl(var(--pk-ink-faint))]">{row.id}</td>
                  <td className="px-3 py-2.5">
                    {isEditing ? (
                      <select value={editDraft!.role} onChange={(e) => setEditDraft((d) => d && { ...d, role: e.target.value as Role, assignedModule: null })} className="rounded-md border border-[hsl(var(--pk-border))] px-2 py-1 text-xs bg-[hsl(var(--pk-surface))] outline-none">
                        {EDITABLE_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    ) : roleDef(row.role).label}
                  </td>
                  <td className="px-3 py-2.5">
                    {isEditing ? (
                      roleDef(editDraft!.role).moduleLocked ? (
                        <select value={editDraft!.assignedModule ?? availableModules(editDraft!.homeEntity)[0]} onChange={(e) => setEditDraft((d) => d && { ...d, assignedModule: e.target.value as Module })} className="rounded-md border border-[hsl(var(--pk-border))] px-2 py-1 text-xs bg-[hsl(var(--pk-surface))] outline-none">
                          {availableModules(editDraft!.homeEntity).map((m) => <option key={m} value={m}>{MODULE_LABEL[m]}</option>)}
                        </select>
                      ) : <span className="text-[hsl(var(--pk-ink-faint))]">—</span>
                    ) : row.assigned_module ? MODULE_LABEL[row.assigned_module] : <span className="text-[hsl(var(--pk-ink-faint))]">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${row.active ? "bg-[hsl(var(--pk-good)/0.12)] text-[hsl(var(--pk-good))]" : "bg-[hsl(var(--pk-bad)/0.12)] text-[hsl(var(--pk-bad))]"}`}>
                      {row.active ? "Active" : "Deactivated"}
                    </span>
                    {row.must_change_password && (
                      <span className="block text-2xs text-[hsl(var(--pk-warn))] mt-1">Must change password</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(row.id)} disabled={busy} className="rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-2xs font-medium px-2.5 py-1 hover:opacity-90 disabled:opacity-60">
                            {busy ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => { setEditingId(null); setEditDraft(null); }} className="text-2xs text-[hsl(var(--pk-ink-faint))] px-2 py-1">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button title="Edit role/pillar" onClick={() => startEdit(row)} disabled={busy} className="p-1.5 rounded-md hover:bg-[hsl(var(--pk-surface-2))] text-[hsl(var(--pk-ink-faint))] disabled:opacity-40">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button title="Reset password" onClick={() => handleResetPassword(row)} disabled={busy} className="p-1.5 rounded-md hover:bg-[hsl(var(--pk-surface-2))] text-[hsl(var(--pk-ink-faint))] disabled:opacity-40">
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                          </button>
                          <button title={row.active ? "Deactivate" : "Reactivate"} onClick={() => handleToggleActive(row)} disabled={busy} className="p-1.5 rounded-md hover:bg-[hsl(var(--pk-surface-2))] text-[hsl(var(--pk-ink-faint))] disabled:opacity-40">
                            {row.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows?.length === 0 && (
          <p className="text-xs text-[hsl(var(--pk-ink-faint))] text-center py-8">No users yet — add one above.</p>
        )}
      </div>

      <div className="mt-4">
        <InfoNote>New and reset accounts start on the default password — they're required to set their own at next sign-in.</InfoNote>
      </div>
    </div>
  );
}
