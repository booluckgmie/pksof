import { ChevronLeft, ChevronRight } from "lucide-react";
import { adjacentPages, screenLabel, type ScreenId } from "@/lib/nav";
import { useSession } from "@/lib/session";

/**
 * Bottom-of-page Previous/Next pager, sitting above the global footer — lets a reader step
 * through the dashboard's own screens in order (MAIN → each pillar end to end, see nav.ts's
 * pageOrder) without going back up to the sidebar/breadcrumb each time. Renders nothing on a
 * screen outside that reading order (Data Entry, Verify & Publish, Settings, Glossary).
 */
export function PageNav({ current, onNavigate }: { current: ScreenId; onNavigate: (id: ScreenId) => void }) {
  const { entityName } = useSession();
  const { prev, next } = adjacentPages(current);
  if (!prev && !next) return null;

  return (
    <div className="flex items-center justify-end gap-2 flex-wrap">
      {prev && (
        <button
          onClick={() => onNavigate(prev.id)}
          className="group flex items-center gap-1.5 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] px-3 py-2 text-left hover:border-[hsl(var(--pk-accent))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-[hsl(var(--pk-ink-faint))] group-hover:text-[hsl(var(--pk-accent))] shrink-0" />
          <span className="flex flex-col leading-tight">
            <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Previous</span>
            <span title={screenLabel(prev.id, entityName)} className="block max-w-[8ch] truncate text-3xs font-medium text-[hsl(var(--pk-ink-soft))] group-hover:text-[hsl(var(--pk-ink))]">{screenLabel(prev.id, entityName)}</span>
          </span>
        </button>
      )}
      {next && (
        <button
          onClick={() => onNavigate(next.id)}
          className="group flex items-center gap-1.5 rounded-md border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] px-3 py-2 text-right hover:border-[hsl(var(--pk-accent))] hover:bg-[hsl(var(--pk-surface-2))] transition-colors"
        >
          <span className="flex flex-col leading-tight">
            <span className="text-3xs uppercase tracking-wide text-[hsl(var(--pk-ink-faint))]">Next</span>
            <span title={screenLabel(next.id, entityName)} className="block max-w-[8ch] truncate text-3xs font-medium text-[hsl(var(--pk-ink-soft))] group-hover:text-[hsl(var(--pk-ink))]">{screenLabel(next.id, entityName)}</span>
          </span>
          <ChevronRight className="h-4 w-4 text-[hsl(var(--pk-ink-faint))] group-hover:text-[hsl(var(--pk-accent))] shrink-0" />
        </button>
      )}
    </div>
  );
}
