import { z } from "zod";
import { cookies } from "next/headers";
import { getDb } from "@/server/db/client";
import { login } from "@/server/auth/service";
import { jsonError, jsonOk } from "@/server/http/respond";
import { sessionCookieOptions } from "@/server/http/session";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const db = await getDb();
    const result = await login(db, body);
    const jar = await cookies();
    jar.set(sessionCookieOptions(result.sessionToken, 60 * 60 * 24 * 14));
    return jsonOk({ user: result.user });
  } catch (error) {
    return jsonError(error);
  }
}
