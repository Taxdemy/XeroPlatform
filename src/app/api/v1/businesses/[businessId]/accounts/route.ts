import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { accounts } from "@/server/db/schema";
import { requireBusinessAccess } from "@/server/access/service";
import { jsonError, jsonOk } from "@/server/http/respond";
import { requireAuthUser } from "@/server/http/session";
import { AppError } from "@/server/lib/errors";

type Params = { params: Promise<{ businessId: string }> };

const createSchema = z.object({
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(200),
  type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  subtype: z.string().max(64).optional(),
  taxCodeId: z.string().uuid().optional(),
});

export async function GET(_request: Request, { params }: Params) {
  try {
    const { businessId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requireBusinessAccess(db, user, businessId);
    const rows = await db.query.accounts.findMany({
      where: eq(accounts.businessId, businessId),
    });
    rows.sort((a, b) => a.code.localeCompare(b.code));
    return jsonOk({ accounts: rows });
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
    try {
      const [account] = await db
        .insert(accounts)
        .values({
          businessId,
          code: body.code,
          name: body.name,
          type: body.type,
          subtype: body.subtype,
          taxCodeId: body.taxCodeId,
        })
        .returning();
      return jsonOk({ account }, { status: 201 });
    } catch {
      throw new AppError("duplicate_code", "Account code already exists", 409);
    }
  } catch (error) {
    return jsonError(error);
  }
}
