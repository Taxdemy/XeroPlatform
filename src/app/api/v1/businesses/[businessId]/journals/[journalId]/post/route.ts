import { getDb } from "@/server/db/client";
import { requireBusinessAccess } from "@/server/access/service";
import { getJournal, postJournal } from "@/server/ledger/engine";
import { jsonError, jsonOk } from "@/server/http/respond";
import { requireAuthUser } from "@/server/http/session";
import { AppError } from "@/server/lib/errors";

type Params = { params: Promise<{ businessId: string; journalId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { businessId, journalId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requireBusinessAccess(db, user, businessId, "canPost");
    const existing = await getJournal(db, journalId);
    if (!existing || existing.businessId !== businessId) {
      throw new AppError("not_found", "Journal not found", 404);
    }
    const journal = await postJournal(db, {
      journalId,
      actorUserId: user.id,
    });
    return jsonOk({ journal });
  } catch (error) {
    return jsonError(error);
  }
}
