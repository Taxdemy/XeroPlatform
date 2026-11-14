import { cookies } from "next/headers";
import { getDb } from "../db/client";
import { getUserBySession, type AuthUser } from "../auth/service";
import { AppError } from "../lib/errors";

export const SESSION_COOKIE = "aa_session";

export async function readSessionToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export async function requireAuthUser(): Promise<AuthUser> {
  const db = await getDb();
  const token = await readSessionToken();
  const user = await getUserBySession(db, token);
  if (!user) {
    throw new AppError("unauthenticated", "Authentication required", 401);
  }
  return user;
}

export function sessionCookieOptions(token: string, maxAgeSeconds: number) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
