import { z } from "zod";
import { getDb } from "@/server/db/client";
import { registerPracticeOwner } from "@/server/auth/service";
import { jsonError, jsonOk } from "@/server/http/respond";
import { sessionCookieOptions } from "@/server/http/session";
import { cookies } from "next/headers";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  fullName: z.string().min(1).max(200),
  practiceName: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const db = await getDb();
    const result = await registerPracticeOwner(db, body);
    const jar = await cookies();
    const cookie = sessionCookieOptions(result.sessionToken, 60 * 60 * 24 * 14);
    jar.set(cookie);
    return jsonOk({
      user: result.user,
      practiceId: result.practiceId,
    });
  } catch (error) {
    return jsonError(error);
  }
}
