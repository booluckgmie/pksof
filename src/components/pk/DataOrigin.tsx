import { Inbox } from "lucide-react";

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
