import { useEffect, useState } from "react";
import { BarChart3, Eye, ExternalLink } from "lucide-react";
import { ScreenHeader } from "@/components/pk/ScreenHeader";
import { StatCard, RefreshButton } from "@/components/pk/Misc";
import { NoDataState } from "@/components/pk/DataOrigin";
import { LineTrend } from "@/components/pk/Charts";
import {
  fetchSiteAnalytics,
  ANALYTICS_REASON_MESSAGE,
  type AnalyticsResponse,
  type AnalyticsDim,
} from "@/lib/api/analytics";
import type { ScreenId } from "@/lib/nav";

/** "YYYY-MM-DD" (or an ISO timestamp) -> "D Mon", matching the short axis labels the rest of the
 * dashboard's trend charts use. */
function shortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function RankedTable({ title, rows, emptyLabel }: { title: string; rows: AnalyticsDim[]; emptyLabel: string }) {
  const total = rows.reduce((s, r) => s + r.views, 0) || 1;
  return (
    <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[hsl(var(--pk-border))]">
        <h3 className="text-xs font-semibold text-[hsl(var(--pk-ink))] uppercase tracking-wide">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-[hsl(var(--pk-ink-faint))] px-4 py-5 text-center">{emptyLabel}</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className={i > 0 ? "border-t border-[hsl(var(--pk-border))]" : undefined}>
                <td className="px-4 py-2 text-[hsl(var(--pk-ink))] truncate max-w-[220px]" title={r.key}>{r.key}</td>
                <td className="px-3 py-2 text-right tnum text-[hsl(var(--pk-ink-faint))] whitespace-nowrap">
                  {((r.views / total) * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-2 text-right tnum font-semibold text-[hsl(var(--pk-ink))] whitespace-nowrap">
                  {r.views.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/** A Vercel access token (and VERCEL_ANALYTICS_TOKEN/_PROJECT_ID) are deployment config, never
 * something this in-app screen can set for itself — so the "fix" here is always "go configure
 * it in Vercel, then come back", not a form. */
function SetupState({ reason, detail }: { reason: string; detail?: string }) {
  const message = ANALYTICS_REASON_MESSAGE[reason] ?? "Web Analytics isn't connected yet.";
  return (
    <NoDataState
      title="Web Analytics isn't connected yet"
      body={`${message} Turn on Web Analytics for this project in the Vercel dashboard (Analytics tab → Enable), then add an environment variable VERCEL_ANALYTICS_TOKEN (a Vercel access token that can read this project) and redeploy.${detail ? ` (${detail})` : ""}`}
      action={
        <a
          href="https://vercel.com/docs/analytics"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--pk-accent))] text-[hsl(var(--pk-accent-ink))] text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
        >
          Vercel Web Analytics docs <ExternalLink className="h-3 w-3" />
        </a>
      }
    />
  );
}

export function SiteUsage({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchSiteAnalytics()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <ScreenHeader
        id="SITE_USAGE"
        subtitle="Vercel Web Analytics for this deployment — page views, visitors and where they come from."
        onNavigate={onNavigate}
        right={<RefreshButton onClick={load} />}
      />

      {loading ? (
        <p className="text-xs text-[hsl(var(--pk-ink-faint))] px-1 py-6 text-center">Loading analytics…</p>
      ) : error ? (
        <NoDataState title="Couldn't load Site Usage" body={error} />
      ) : !data ? null : !data.connected ? (
        <SetupState reason={data.reason} detail={data.detail} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            <StatCard label="Page views" value={data.totals.views.toLocaleString()} sub={`Last ${data.days} days`} rail />
            <StatCard label="Visitors" value={data.totals.visitors.toLocaleString()} sub={`Last ${data.days} days`} rail />
            <StatCard label="Top page" value={data.pages[0]?.key ?? "—"} sub={data.pages[0] ? `${data.pages[0].views.toLocaleString()} views` : undefined} />
            <StatCard label="Top country" value={data.countries[0]?.key ?? "—"} sub={data.countries[0] ? `${data.countries[0].views.toLocaleString()} views` : undefined} />
          </div>

          <div className="rounded-lg border border-[hsl(var(--pk-border))] bg-[hsl(var(--pk-surface))] shadow-card p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[hsl(var(--pk-ink))] uppercase tracking-wide flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-[hsl(var(--pk-ink-faint))]" /> Daily views
              </h3>
              <span className="text-2xs text-[hsl(var(--pk-ink-faint))]">{data.since} – {data.until}</span>
            </div>
            {data.daily.length === 0 ? (
              <p className="text-xs text-[hsl(var(--pk-ink-faint))] py-6 text-center">No traffic recorded yet for this period.</p>
            ) : (
              <LineTrend
                data={data.daily.map((d) => ({ label: shortDate(d.key), value: d.views }))}
                color="hsl(var(--pk-accent))"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RankedTable title="Top pages" rows={data.pages} emptyLabel="No page-view data yet." />
            <RankedTable title="Top countries" rows={data.countries} emptyLabel="No country data yet." />
            <RankedTable title="Devices" rows={data.devices} emptyLabel="No device data yet." />
            <RankedTable title="Referrers" rows={data.referrers} emptyLabel="No referrer data yet." />
          </div>

          <p className="text-2xs text-[hsl(var(--pk-ink-faint))] mt-4 flex items-center gap-1.5">
            <Eye className="h-3 w-3" /> Aggregated figures only — Vercel Web Analytics never exposes individual visitor data.
          </p>
        </>
      )}
    </div>
  );
}
