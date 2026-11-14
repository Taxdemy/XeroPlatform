import { getDb } from "@/server/db/client";
import { requireBusinessAccess } from "@/server/access/service";
import { trialBalance } from "@/server/reports/service";
import { jsonError, jsonOk } from "@/server/http/respond";
import { requireAuthUser } from "@/server/http/session";

type Params = { params: Promise<{ businessId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { businessId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requireBusinessAccess(db, user, businessId);
    const url = new URL(request.url);
    const report = await trialBalance(db, {
      businessId,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });
    return jsonOk(report);
  } catch (error) {
    return jsonError(error);
  }
}
