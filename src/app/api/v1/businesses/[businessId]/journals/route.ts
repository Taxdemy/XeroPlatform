import { z } from "zod";
import { getDb } from "@/server/db/client";
import { requireBusinessAccess } from "@/server/access/service";
import { createDraftJournal, listJournals } from "@/server/ledger/engine";
import { jsonError, jsonOk } from "@/server/http/respond";
import { requireAuthUser } from "@/server/http/session";

type Params = { params: Promise<{ businessId: string }> };

const lineSchema = z.object({
  accountId: z.string().uuid(),
  description: z.string().optional(),
  debitCents: z.union([z.number().int(), z.string()]),
  creditCents: z.union([z.number().int(), z.string()]),
  taxCodeId: z.string().uuid().nullable().optional(),
  taxCents: z.union([z.number().int(), z.string()]).optional(),
});

const createSchema = z.object({
  date: z.string(),
  narration: z.string().optional(),
  idempotencyKey: z.string().max(200).optional(),
  sourceType: z.string().optional(),
  lines: z.array(lineSchema).min(2),
});

export async function GET(_request: Request, { params }: Params) {
  try {
    const { businessId } = await params;
    const user = await requireAuthUser();
    const db = await getDb();
    await requireBusinessAccess(db, user, businessId);
    const journals = await listJournals(db, businessId);
    return jsonOk({ journals });
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
    const journal = await createDraftJournal(db, {
      businessId,
      actorUserId: user.id,
      ...body,
    });
    return jsonOk({ journal }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
