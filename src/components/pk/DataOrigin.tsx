import { CheckCircle2, FileClock, Inbox } from "lucide-react";
import type { KpiResult } from "@/lib/workflow";

export function DataOriginBadge({ result }: { result: KpiResult }) {
  if (result.origin === "submission") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-[hsl(var(--pk-good))] font-medium">
        <CheckCircle2 className="h-3 w-3" />
        Published via Verify &amp; Publish{result.lastUpdatedBy ? ` · ${result.lastUpdatedBy}` : ""}
      </span>
    );
  }
  if (result.origin === "seed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-[hsl(var(--pk-ink-faint))]">
        <FileClock className="h-3 w-3" />
        Sample data
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[hsl(var(--pk-pending))]">
      <Inbox className="h-3 w-3" />
      No submission yet
    </span>
  );
}

export function NoDataState({ title = "Nothing published yet", body, action }: { title?: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 rounded-lg border border-dashed border-[hsl(var(--pk-border))] py-10 px-6">
      <Inbox className="h-6 w-6 text-[hsl(var(--pk-ink-faint))]" />
      <div className="font-head text-base font-semibold text-[hsl(var(--pk-ink))]">{title}</div>
      {body && <p className="text-sm text-[hsl(var(--pk-ink-faint))] max-w-[46ch]">{body}</p>}
      {action}
    </div>
  );
}
