import { z } from "zod";
import { getDb } from "@/server/db/client";
import { requirePracticeMember } from "@/server/access/service";
import {
  createBusiness,
  listBusinessesForPractice,
} from "@/server/businesses/service";
import { jsonError, jsonOk } from "@/server/http/respond";
import { requireAuthUser } from "@/server/http/session";

const createSchema = z.object({
  legalName: z.string().min(1).max(300),
  tradingName: z.string().max(300).optional(),
  abn: z.string().max(14).optional(),
  acn: z.string().max(12).optional(),
  entityType: z
    .enum(["sole_trader", "company", "trust", "partnership", "smsf", "other"])
    .optional(),
  gstRegistered: z.boolean().optional(),
  gstBasis: z.enum(["cash", "accrual"]).optional(),
  basCycle: z.enum(["monthly", "quarterly", "annually"]).optional(),
  basReportingMethod: z.enum(["simpler", "full", "instalment"]).optional(),
  conversionDate: z.string().optional(),
});

type Params = { params: Promise<{ practiceId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { practiceId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requirePracticeMember(db, user, practiceId);
    const businesses = await listBusinessesForPractice(db, practiceId);
    return jsonOk({ businesses });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { practiceId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requirePracticeMember(db, user, practiceId);
    const body = createSchema.parse(await request.json());
    const business = await createBusiness(db, {
      practiceId,
      actorUserId: user.id,
      ...body,
    });
    return jsonOk({ business }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
