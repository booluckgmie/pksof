import type { ReactNode } from "react";
import { screenLabel, breadcrumbTrail, type ScreenId } from "@/lib/nav";
import { Breadcrumb, ExportMenu } from "@/components/pk/Misc";
import { useSession } from "@/lib/session";
import type { PeriodId } from "@/types";

export function ScreenHeader({
  id,
  subtitle,
  onNavigate,
  right,
  periodId,
}: {
  id: ScreenId;
  subtitle?: string;
  onNavigate: (id: ScreenId) => void;
  right?: ReactNode;
  /** The reporting period actually filtered on this screen — passed through to ExportMenu so exports
   * reflect this page's own picker rather than the (possibly stale) global session period. Screens
   * with no period concept of their own can omit this and ExportMenu falls back to the session period. */
  periodId?: PeriodId;
}) {
  const { entityName } = useSession();
  // A single-item trail (Main only, today) just repeats the H1 below it — skip that row's
  // wording entirely rather than show a breadcrumb of one.
  const showBreadcrumb = breadcrumbTrail(id).length > 1;

  return (
    <div data-screen-chrome className="flex flex-col gap-3 pb-4 mb-5 border-b border-[hsl(var(--pk-border))]">
      <div className="flex items-center justify-between gap-3">
        {showBreadcrumb && <Breadcrumb current={id} onNavigate={onNavigate} />}
        <div className="flex items-center gap-2 ml-auto">
          <ExportMenu screenId={id} periodId={periodId} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-head text-2xl font-bold text-[hsl(var(--pk-ink))]">{screenLabel(id, entityName)}</h1>
          {subtitle && <p className="text-sm text-[hsl(var(--pk-ink-faint))] mt-1">{subtitle}</p>}
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </div>
  );
}
