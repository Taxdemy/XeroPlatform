import { z } from "zod";
import { getDb } from "@/server/db/client";
import { requireBusinessAccess } from "@/server/access/service";
import { getJournal, reverseJournal } from "@/server/ledger/engine";
import { jsonError, jsonOk } from "@/server/http/respond";
import { requireAuthUser } from "@/server/http/session";
import { AppError } from "@/server/lib/errors";

type Params = { params: Promise<{ businessId: string; journalId: string }> };

const bodySchema = z.object({
  reversalDate: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const { businessId, journalId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requireBusinessAccess(db, user, businessId, "canPost");
    const existing = await getJournal(db, journalId);
    if (!existing || existing.businessId !== businessId) {
      throw new AppError("not_found", "Journal not found", 404);
    }
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const result = await reverseJournal(db, {
      journalId,
      actorUserId: user.id,
      ...body,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
