/** Client for GET /api/analytics (api/analytics.js) — aggregated Vercel Web Analytics for this
 * project. Mirrors the serverless function's own response shape 1:1 rather than re-normalising
 * it client-side. `connected: false` is a normal, expected response (analytics not configured
 * yet for this project) — not an error — so SiteUsage.tsx renders a setup state for it instead
 * of throwing. */

export interface AnalyticsDim {
  key: string;
  views: number;
  visitors: number;
}

export type AnalyticsReason = "no_token" | "no_project" | "api_error" | string;

export interface AnalyticsDisconnected {
  connected: false;
  reason: AnalyticsReason;
  detail?: string;
}

export interface AnalyticsConnected {
  connected: true;
  days: number;
  since: string;
  until: string;
  daily: AnalyticsDim[];
  pages: AnalyticsDim[];
  countries: AnalyticsDim[];
  devices: AnalyticsDim[];
  referrers: AnalyticsDim[];
  browsers: AnalyticsDim[];
  totals: { views: number; visitors: number };
}

export type AnalyticsResponse = AnalyticsConnected | AnalyticsDisconnected;

/** Plain human-language explanation for each `reason` the endpoint can send back — shown
 * directly in SiteUsage.tsx's setup state rather than a raw error code. */
export const ANALYTICS_REASON_MESSAGE: Record<string, string> = {
  no_token: "No Vercel access token is configured for this project yet.",
  no_project: "No Vercel project id is configured for this deployment yet.",
  api_error: "Vercel's Web Analytics API couldn't be reached.",
};

export async function fetchSiteAnalytics(): Promise<AnalyticsResponse> {
  const res = await fetch("/api/analytics");
  if (!res.ok) throw new Error(`/api/analytics responded ${res.status}`);
  return (await res.json()) as AnalyticsResponse;
}
