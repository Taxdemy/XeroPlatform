import { and, desc, eq, sql } from "drizzle-orm";
import type { AppDatabase } from "../db/client";
import {
  accountingPeriods,
  accounts,
  businesses,
  journalLines,
  journals,
} from "../db/schema";
import { writeAudit } from "../audit";
import { AppError } from "../lib/errors";
import { cents, type Cents } from "../lib/money";

export type JournalLineInput = {
  accountId: string;
  description?: string;
  debitCents: number | string | bigint;
  creditCents: number | string | bigint;
  taxCodeId?: string | null;
  taxCents?: number | string | bigint;
};

export type CreateJournalInput = {
  businessId: string;
  date: string; // YYYY-MM-DD
  narration?: string;
  sourceType?: string;
  sourceId?: string | null;
  idempotencyKey?: string | null;
  lines: JournalLineInput[];
  actorUserId: string;
};

function assertLineShape(line: JournalLineInput, index: number): {
  debit: Cents;
  credit: Cents;
  tax: Cents;
} {
  const zero = BigInt(0);
  const debit = cents(line.debitCents);
  const credit = cents(line.creditCents);
  const tax = cents(line.taxCents ?? 0);
  if (debit < zero || credit < zero) {
    throw new AppError(
      "invalid_line",
      `Line ${index + 1}: debit/credit cannot be negative`,
    );
  }
  if (debit > zero && credit > zero) {
    throw new AppError(
      "invalid_line",
      `Line ${index + 1}: cannot have both debit and credit`,
    );
  }
  if (debit === zero && credit === zero) {
    throw new AppError(
      "invalid_line",
      `Line ${index + 1}: must have a debit or credit`,
    );
  }
  return { debit, credit, tax };
}

export function computeTotals(lines: JournalLineInput[]): {
  debitTotal: Cents;
  creditTotal: Cents;
  balanced: boolean;
} {
  const zero = BigInt(0);
  let debitTotal = zero;
  let creditTotal = zero;
  lines.forEach((line, i) => {
    const { debit, credit } = assertLineShape(line, i);
    debitTotal += debit;
    creditTotal += credit;
  });
  return {
    debitTotal,
    creditTotal,
    balanced: debitTotal === creditTotal && debitTotal > zero,
  };
}

async function resolveOpenPeriod(
  db: AppDatabase,
  businessId: string,
  date: string,
) {
  const period = await db.query.accountingPeriods.findFirst({
    where: and(
      eq(accountingPeriods.businessId, businessId),
      sql`${accountingPeriods.startDate} <= ${date}`,
      sql`${accountingPeriods.endDate} >= ${date}`,
    ),
  });
  if (!period) {
    throw new AppError(
      "period_missing",
      `No accounting period covers ${date}`,
    );
  }
  if (period.status !== "open") {
    throw new AppError(
      "period_locked",
      `Period ${period.name} is ${period.status}`,
      409,
    );
  }
  return period;
}

async function nextJournalNumber(
  db: AppDatabase,
  businessId: string,
): Promise<number> {
  const [row] = await db
    .select({
      max: sql<number>`coalesce(max(${journals.journalNumber}), 0)`,
    })
    .from(journals)
    .where(eq(journals.businessId, businessId));
  return Number(row?.max ?? 0) + 1;
}

async function validateAccounts(
  db: AppDatabase,
  businessId: string,
  lines: JournalLineInput[],
) {
  for (const [i, line] of lines.entries()) {
    const account = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.id, line.accountId),
        eq(accounts.businessId, businessId),
        eq(accounts.isActive, true),
      ),
    });
    if (!account) {
      throw new AppError(
        "invalid_account",
        `Line ${i + 1}: account not found for this business`,
      );
    }
  }
}

export async function createDraftJournal(
  db: AppDatabase,
  input: CreateJournalInput,
) {
  if (!input.lines || input.lines.length < 2) {
    throw new AppError("invalid_journal", "Journal requires at least two lines");
  }

  // Validate line shapes early (drafts may be unbalanced).
  input.lines.forEach(assertLineShape);

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, input.businessId),
  });
  if (!business) {
    throw new AppError("not_found", "Business not found", 404);
  }

  if (input.idempotencyKey) {
    const existing = await db.query.journals.findFirst({
      where: and(
        eq(journals.businessId, input.businessId),
        eq(journals.idempotencyKey, input.idempotencyKey),
      ),
    });
    if (existing) {
      return getJournal(db, existing.id);
    }
  }

  await validateAccounts(db, input.businessId, input.lines);
  const period = await resolveOpenPeriod(db, input.businessId, input.date);
  const journalNumber = await nextJournalNumber(db, input.businessId);

  const [journal] = await db
    .insert(journals)
    .values({
      practiceId: business.practiceId,
      businessId: input.businessId,
      journalNumber,
      date: input.date,
      narration: input.narration ?? "",
      sourceType: input.sourceType ?? "manual",
      sourceId: input.sourceId ?? null,
      status: "draft",
      idempotencyKey: input.idempotencyKey ?? null,
      periodId: period.id,
      createdBy: input.actorUserId,
    })
    .returning();

  await db.insert(journalLines).values(
    input.lines.map((line, index) => {
      const { debit, credit, tax } = assertLineShape(line, index);
      return {
        journalId: journal.id,
        businessId: input.businessId,
        lineNo: index + 1,
        accountId: line.accountId,
        description: line.description ?? "",
        debitCents: debit,
        creditCents: credit,
        taxCodeId: line.taxCodeId ?? null,
        taxCents: tax,
      };
    }),
  );

  await writeAudit(db, {
    practiceId: business.practiceId,
    businessId: input.businessId,
    actorUserId: input.actorUserId,
    action: "journal.created",
    entityType: "journal",
    entityId: journal.id,
    after: { journalNumber, date: input.date, status: "draft" },
  });

  return getJournal(db, journal.id);
}

export async function postJournal(
  db: AppDatabase,
  input: { journalId: string; actorUserId: string },
) {
  const journal = await db.query.journals.findFirst({
    where: eq(journals.id, input.journalId),
  });
  if (!journal) {
    throw new AppError("not_found", "Journal not found", 404);
  }
  if (journal.status === "posted") {
    return getJournal(db, journal.id);
  }
  if (journal.status !== "draft") {
    throw new AppError(
      "invalid_status",
      `Cannot post journal in status ${journal.status}`,
      409,
    );
  }

  const lines = await db.query.journalLines.findMany({
    where: eq(journalLines.journalId, journal.id),
  });
  const totals = computeTotals(
    lines.map((l) => ({
      accountId: l.accountId,
      debitCents: l.debitCents,
      creditCents: l.creditCents,
      taxCents: l.taxCents,
    })),
  );
  if (!totals.balanced) {
    throw new AppError(
      "unbalanced",
      `Journal does not balance: debit ${totals.debitTotal} != credit ${totals.creditTotal}`,
      400,
      {
        debitTotal: totals.debitTotal.toString(),
        creditTotal: totals.creditTotal.toString(),
      },
    );
  }

  await resolveOpenPeriod(db, journal.businessId, journal.date);

  const [updated] = await db
    .update(journals)
    .set({
      status: "posted",
      postedAt: new Date(),
      postedBy: input.actorUserId,
      updatedAt: new Date(),
    })
    .where(and(eq(journals.id, journal.id), eq(journals.status, "draft")))
    .returning();

  if (!updated) {
    throw new AppError("conflict", "Journal was modified concurrently", 409);
  }

  await writeAudit(db, {
    practiceId: journal.practiceId,
    businessId: journal.businessId,
    actorUserId: input.actorUserId,
    action: "journal.posted",
    entityType: "journal",
    entityId: journal.id,
    before: { status: "draft" },
    after: { status: "posted" },
  });

  return getJournal(db, journal.id);
}

export async function reverseJournal(
  db: AppDatabase,
  input: {
    journalId: string;
    actorUserId: string;
    reversalDate?: string;
    idempotencyKey?: string;
  },
) {
  const original = await getJournal(db, input.journalId);
  if (!original) {
    throw new AppError("not_found", "Journal not found", 404);
  }
  if (original.status !== "posted") {
    throw new AppError(
      "invalid_status",
      "Only posted journals can be reversed",
      409,
    );
  }

  const reversalDate = input.reversalDate ?? original.date;
  const draft = await createDraftJournal(db, {
    businessId: original.businessId,
    date: reversalDate,
    narration: `Reversal of journal ${original.journalNumber}: ${original.narration}`,
    sourceType: "reversal",
    sourceId: original.id,
    idempotencyKey: input.idempotencyKey ?? `reversal:${original.id}`,
    actorUserId: input.actorUserId,
    lines: original.lines.map((line) => ({
      accountId: line.accountId,
      description: line.description,
      debitCents: line.creditCents,
      creditCents: line.debitCents,
      taxCodeId: line.taxCodeId,
      taxCents: line.taxCents,
    })),
  });
  if (!draft) {
    throw new AppError("internal_error", "Failed to create reversal draft", 500);
  }

  await db
    .update(journals)
    .set({ reversalOfJournalId: original.id, updatedAt: new Date() })
    .where(eq(journals.id, draft.id));

  const posted = await postJournal(db, {
    journalId: draft.id,
    actorUserId: input.actorUserId,
  });
  if (!posted) {
    throw new AppError("internal_error", "Failed to post reversal", 500);
  }

  await db
    .update(journals)
    .set({ status: "reversed", updatedAt: new Date() })
    .where(eq(journals.id, original.id));

  await writeAudit(db, {
    practiceId: original.practiceId,
    businessId: original.businessId,
    actorUserId: input.actorUserId,
    action: "journal.reversed",
    entityType: "journal",
    entityId: original.id,
    after: { reversalJournalId: posted.id },
  });

  return {
    original: await getJournal(db, original.id),
    reversal: posted,
  };
}

export async function getJournal(db: AppDatabase, journalId: string) {
  const journal = await db.query.journals.findFirst({
    where: eq(journals.id, journalId),
  });
  if (!journal) return null;
  const lines = await db.query.journalLines.findMany({
    where: eq(journalLines.journalId, journalId),
  });
  lines.sort((a, b) => a.lineNo - b.lineNo);
  return {
    ...journal,
    lines: lines.map((l) => ({
      ...l,
      debitCents: l.debitCents.toString(),
      creditCents: l.creditCents.toString(),
      taxCents: l.taxCents.toString(),
    })),
  };
}

export async function listJournals(db: AppDatabase, businessId: string) {
  const rows = await db.query.journals.findMany({
    where: eq(journals.businessId, businessId),
    orderBy: [desc(journals.journalNumber)],
  });
  return rows;
}
