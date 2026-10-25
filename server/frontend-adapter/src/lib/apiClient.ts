// Replaces src/lib/supabase.ts. A thin fetch wrapper for the self-hosted backend
// (server/src/index.ts) — same role getSupabase() played, but talking to a plain REST API
// instead of Supabase's auto-generated one. Every src/lib/api/*.ts file in this folder calls
// through here instead of `getSupabase().from(...)`.

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export const isApiConfigured = Boolean(API_URL);

const configErrorMessage =
  "Missing VITE_API_URL. Copy .env.example to .env and point it at your backend (e.g. http://pksof.internal:4000/api).";

const TOKEN_KEY = "pksof_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Private-browsing / storage-disabled — the session just won't persist across reloads.
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** For multipart/form-data uploads — pass a FormData instead of a JSON body. */
  form?: FormData;
}

export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (!API_URL) throw new Error(configErrorMessage);
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!opts.form) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Downloads a stored upload's original file — returns a Blob + filename for the caller to
 * trigger a browser download with, replacing uploadFileUrl's plain public Supabase Storage URL
 * (this endpoint now requires auth, so it can't just be a plain <a href>). */
export async function apiDownload(path: string): Promise<Blob> {
  if (!API_URL) throw new Error(configErrorMessage);
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new ApiError(`Download failed (${res.status})`, res.status);
  return res.blob();
}
