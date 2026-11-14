import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { taxCodes } from "@/server/db/schema";
import { requireBusinessAccess } from "@/server/access/service";
import { jsonError, jsonOk } from "@/server/http/respond";
import { requireAuthUser } from "@/server/http/session";

type Params = { params: Promise<{ businessId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { businessId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requireBusinessAccess(db, user, businessId);
    const rows = await db.query.taxCodes.findMany({
      where: eq(taxCodes.businessId, businessId),
    });
    return jsonOk({ taxCodes: rows });
  } catch (error) {
    return jsonError(error);
  }
}
