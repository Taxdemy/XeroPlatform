import { z } from "zod";
import { getDb } from "@/server/db/client";
import { requireBusinessAccess } from "@/server/access/service";
import { updateBusiness } from "@/server/businesses/service";
import { jsonError, jsonOk } from "@/server/http/respond";
import { requireAuthUser } from "@/server/http/session";

type Params = { params: Promise<{ businessId: string }> };

const patchSchema = z.object({
  legalName: z.string().min(1).max(300).optional(),
  tradingName: z.string().max(300).nullable().optional(),
  abn: z.string().max(14).nullable().optional(),
  acn: z.string().max(12).nullable().optional(),
  gstRegistered: z.boolean().optional(),
  gstBasis: z.enum(["cash", "accrual"]).optional(),
  basCycle: z.enum(["monthly", "quarterly", "annually"]).optional(),
  basReportingMethod: z.enum(["simpler", "full", "instalment"]).optional(),
  conversionDate: z.string().nullable().optional(),
});

export async function GET(_request: Request, { params }: Params) {
  try {
    const { businessId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    const { business } = await requireBusinessAccess(db, user, businessId);
    return jsonOk({ business });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { businessId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requireBusinessAccess(db, user, businessId, "canEdit");
    const body = patchSchema.parse(await request.json());
    const business = await updateBusiness(db, businessId, body, user.id);
    return jsonOk({ business });
  } catch (error) {
    return jsonError(error);
  }
}
