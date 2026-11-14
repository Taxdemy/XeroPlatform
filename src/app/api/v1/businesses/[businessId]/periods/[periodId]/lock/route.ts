import { getDb } from "@/server/db/client";
import { requireBusinessAccess } from "@/server/access/service";
import { lockPeriod } from "@/server/businesses/service";
import { jsonError, jsonOk } from "@/server/http/respond";
import { requireAuthUser } from "@/server/http/session";

type Params = { params: Promise<{ businessId: string; periodId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { businessId, periodId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requireBusinessAccess(db, user, businessId, "canApprove");
    const period = await lockPeriod(db, periodId, user.id);
    return jsonOk({ period });
  } catch (error) {
    return jsonError(error);
  }
}
