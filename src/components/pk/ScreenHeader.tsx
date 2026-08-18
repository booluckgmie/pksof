import type { ReactNode } from "react";
import { screens, screenLabel, type ScreenId } from "@/lib/nav";
import { Breadcrumb, ExportMenu, LevelPill, NotificationsBell, RefreshButton } from "@/components/pk/Misc";
import { useWorkflow } from "@/lib/workflow";
import { useSession } from "@/lib/session";

export function ScreenHeader({
  id,
  subtitle,
  onNavigate,
  right,
  lastUpdated = "6 May 2026, 09:30",
}: {
  id: ScreenId;
  subtitle?: string;
  onNavigate: (id: ScreenId) => void;
  right?: ReactNode;
  lastUpdated?: string;
}) {
  const s = screens[id];
  const { pending } = useWorkflow();
  const { entityName } = useSession();

  return (
    <div className="flex flex-col gap-3 pb-4 mb-5 border-b border-[hsl(var(--pk-border))]">
      <div className="flex items-center justify-between gap-3">
        <Breadcrumb current={id} onNavigate={onNavigate} />
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[11px] text-[hsl(var(--pk-ink-faint))]">Last updated {lastUpdated}</span>
          <RefreshButton />
          <ExportMenu screenId={id} />
          <NotificationsBell count={pending.length} />
        </div>
      </div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <LevelPill level={s.level} />
          <span className="font-mono-pk text-[11px] text-[hsl(var(--pk-ink-faint))]">{s.code}</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-4 flex-wrap -mt-1">
        <div>
          <h1 className="font-head text-2xl font-semibold text-[hsl(var(--pk-ink))]">{screenLabel(id, entityName)}</h1>
          {subtitle && <p className="text-sm text-[hsl(var(--pk-ink-faint))] mt-1 max-w-[65ch]">{subtitle}</p>}
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </div>
  );
}
