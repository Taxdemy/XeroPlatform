import { cookies } from "next/headers";
import { getDb } from "@/server/db/client";
import { logout } from "@/server/auth/service";
import { jsonError, jsonOk } from "@/server/http/respond";
import { SESSION_COOKIE, readSessionToken } from "@/server/http/session";

export async function POST() {
  try {
    const db = await getDb();
    const token = await readSessionToken();
    if (token) await logout(db, token);
    const jar = await cookies();
    jar.delete(SESSION_COOKIE);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
