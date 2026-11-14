import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session";

/** Server-side call into our own API routes with the session cookie. */
export async function apiFetch(path: string, init?: RequestInit) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const headers = new Headers(init?.headers);
  if (token) headers.set("cookie", `${SESSION_COOKIE}=${token}`);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000";
  // Prefer direct service calls from server components; this helper is for
  // cases where route reuse is convenient during Phase 1.
  return fetch(`${base}${path}`, { ...init, headers, cache: "no-store" });
}
