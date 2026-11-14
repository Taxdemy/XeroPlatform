import { getDb } from "@/server/db/client";
import { listMemberships } from "@/server/auth/service";
import { jsonError, jsonOk } from "@/server/http/respond";
import { requireAuthUser } from "@/server/http/session";

export async function GET() {
  try {
    const user = await requireAuthUser();
    const db = await getDb();
    const memberships = await listMemberships(db, user.id);
    return jsonOk({
      practices: memberships.map((m) => ({
        id: m.practiceId,
        name: m.practiceName,
        slug: m.practiceSlug,
        role: m.role,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
