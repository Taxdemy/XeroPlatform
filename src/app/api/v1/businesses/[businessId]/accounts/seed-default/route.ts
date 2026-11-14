import { getDb } from "@/server/db/client";
import { requireBusinessAccess } from "@/server/access/service";
import { seedDefaultChartOfAccounts } from "@/server/accounting/seeds";
import { jsonError, jsonOk } from "@/server/http/respond";
import { requireAuthUser } from "@/server/http/session";

type Params = { params: Promise<{ businessId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { businessId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requireBusinessAccess(db, user, businessId, "canEdit");
    const accounts = await seedDefaultChartOfAccounts(db, businessId);
    return jsonOk({ accounts });
  } catch (error) {
    return jsonError(error);
  }
}
