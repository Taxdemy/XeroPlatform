import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { accountingPeriods } from "@/server/db/schema";
import { requireBusinessAccess } from "@/server/access/service";
import { createPeriod } from "@/server/businesses/service";
import { jsonError, jsonOk } from "@/server/http/respond";
import { requireAuthUser } from "@/server/http/session";

type Params = { params: Promise<{ businessId: string }> };

const createSchema = z.object({
  name: z.string().min(1).max(120),
  startDate: z.string(),
  endDate: z.string(),
});

export async function GET(_request: Request, { params }: Params) {
  try {
    const { businessId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requireBusinessAccess(db, user, businessId);
    const periods = await db.query.accountingPeriods.findMany({
      where: eq(accountingPeriods.businessId, businessId),
    });
    return jsonOk({ periods });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { businessId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requireBusinessAccess(db, user, businessId, "canEdit");
    const body = createSchema.parse(await request.json());
    const period = await createPeriod(db, {
      businessId,
      actorUserId: user.id,
      ...body,
    });
    return jsonOk({ period }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
