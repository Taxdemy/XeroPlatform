import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import type { AppDatabase } from "../db/client";
import { accounts, journalLines, journals } from "../db/schema";

/** Posted history includes originals later marked reversed (offset by reversal journals). */
const POSTED_HISTORY = ["posted", "reversed"] as const;

export async function trialBalance(
  db: AppDatabase,
  input: { businessId: string; from?: string; to?: string },
) {
  const conditions = [
    eq(journals.businessId, input.businessId),
    inArray(journals.status, [...POSTED_HISTORY]),
  ];
  if (input.from) conditions.push(gte(journals.date, input.from));
  if (input.to) conditions.push(lte(journals.date, input.to));

  const rows = await db
    .select({
      accountId: accounts.id,
      code: accounts.code,
      name: accounts.name,
      type: accounts.type,
      debitCents: sql<string>`coalesce(sum(${journalLines.debitCents}), 0)`,
      creditCents: sql<string>`coalesce(sum(${journalLines.creditCents}), 0)`,
    })
    .from(journalLines)
    .innerJoin(journals, eq(journals.id, journalLines.journalId))
    .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
    .where(and(...conditions))
    .groupBy(accounts.id, accounts.code, accounts.name, accounts.type)
    .orderBy(accounts.code);

  const mapped = rows.map((r) => {
    const debit = BigInt(r.debitCents);
    const credit = BigInt(r.creditCents);
    return {
      accountId: r.accountId,
      code: r.code,
      name: r.name,
      type: r.type,
      debitCents: debit.toString(),
      creditCents: credit.toString(),
      balanceCents: (debit - credit).toString(),
    };
  });

  const zero = BigInt(0);
  const totals = mapped.reduce(
    (acc, row) => {
      acc.debit += BigInt(row.debitCents);
      acc.credit += BigInt(row.creditCents);
      return acc;
    },
    { debit: zero, credit: zero },
  );

  return {
    accounts: mapped,
    totals: {
      debitCents: totals.debit.toString(),
      creditCents: totals.credit.toString(),
      balanced: totals.debit === totals.credit,
    },
  };
}

export async function generalLedger(
  db: AppDatabase,
  input: {
    businessId: string;
    accountId: string;
    from?: string;
    to?: string;
  },
) {
  const conditions = [
    eq(journals.businessId, input.businessId),
    inArray(journals.status, [...POSTED_HISTORY]),
    eq(journalLines.accountId, input.accountId),
  ];
  if (input.from) conditions.push(gte(journals.date, input.from));
  if (input.to) conditions.push(lte(journals.date, input.to));

  const rows = await db
    .select({
      journalId: journals.id,
      journalNumber: journals.journalNumber,
      date: journals.date,
      narration: journals.narration,
      lineNo: journalLines.lineNo,
      description: journalLines.description,
      debitCents: journalLines.debitCents,
      creditCents: journalLines.creditCents,
    })
    .from(journalLines)
    .innerJoin(journals, eq(journals.id, journalLines.journalId))
    .where(and(...conditions))
    .orderBy(journals.date, journals.journalNumber, journalLines.lineNo);

  let running = BigInt(0);
  const lines = rows.map((r) => {
    running += r.debitCents - r.creditCents;
    return {
      journalId: r.journalId,
      journalNumber: r.journalNumber,
      date: r.date,
      narration: r.narration,
      lineNo: r.lineNo,
      description: r.description,
      debitCents: r.debitCents.toString(),
      creditCents: r.creditCents.toString(),
      runningBalanceCents: running.toString(),
    };
  });

  return { accountId: input.accountId, lines };
}
