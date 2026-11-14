import { getDb } from "@/server/db/client";
import { requireBusinessAccess } from "@/server/access/service";
import { getJournal } from "@/server/ledger/engine";
import { jsonError, jsonOk } from "@/server/http/respond";
import { requireAuthUser } from "@/server/http/session";
import { AppError } from "@/server/lib/errors";

type Params = { params: Promise<{ businessId: string; journalId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { businessId, journalId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requireBusinessAccess(db, user, businessId);
    const journal = await getJournal(db, journalId);
    if (!journal || journal.businessId !== businessId) {
      throw new AppError("not_found", "Journal not found", 404);
    }
    return jsonOk({ journal });
  } catch (error) {
    return jsonError(error);
  }
}
