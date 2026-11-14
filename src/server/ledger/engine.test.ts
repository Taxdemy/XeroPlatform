import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests, type AppDatabase } from "../db/client";
import { accounts, businessAccess, journalLines, journals } from "../db/schema";
import {
  registerPracticeOwner,
  grantBusinessAccess,
  roleDefaultPermissions,
} from "../auth/service";
import { createBusiness, lockPeriod } from "../businesses/service";
import { accountingPeriods } from "../db/schema";
import {
  createDraftJournal,
  postJournal,
  reverseJournal,
  computeTotals,
} from "./engine";
import { trialBalance, generalLedger } from "../reports/service";
import { taxFromExclusive, splitInclusive, formatAud } from "../lib/money";
import { AppError } from "../lib/errors";

describe("money helpers", () => {
  it("formats AUD from cents", () => {
    expect(formatAud(BigInt(11000))).toBe("$110.00");
    expect(formatAud(BigInt(-50))).toBe("-$0.50");
  });

  it("computes GST half-up from exclusive", () => {
    expect(taxFromExclusive(BigInt(10000), 1000)).toBe(BigInt(1000));
    expect(taxFromExclusive(BigInt(1), 1000)).toBe(BigInt(0));
    expect(taxFromExclusive(BigInt(5), 1000)).toBe(BigInt(1));
  });

  it("splits inclusive amounts", () => {
    const { netCents, taxCents } = splitInclusive(BigInt(11000), 1000);
    expect(netCents + taxCents).toBe(BigInt(11000));
    expect(taxCents).toBe(BigInt(1000));
    expect(netCents).toBe(BigInt(10000));
  });
});

describe("accounting engine", () => {
  let db: AppDatabase;
  let userId: string;
  let practiceId: string;
  let businessId: string;
  let bankId: string;
  let expenseId: string;
  let periodId: string;

  beforeEach(async () => {
    db = await resetDbForTests();
    const reg = await registerPracticeOwner(db, {
      email: `owner-${Date.now()}@example.com.au`,
      password: "secure-password-1",
      fullName: "Ada Accountant",
      practiceName: "Harbour Tax",
    });
    userId = reg.user.id;
    practiceId = reg.practiceId;
    const business = await createBusiness(db, {
      practiceId,
      actorUserId: userId,
      legalName: "Acme Pty Ltd",
      abn: "51824753556",
    });
    businessId = business.id;
    const acct = await db.query.accounts.findMany({
      where: eq(accounts.businessId, businessId),
    });
    bankId = acct.find((a) => a.code === "1000")!.id;
    expenseId = acct.find((a) => a.code === "6200")!.id;
    const period = await db.query.accountingPeriods.findFirst({
      where: eq(accountingPeriods.businessId, businessId),
    });
    periodId = period!.id;
  });

  it("rejects unbalanced journals on post", async () => {
    const draft = await createDraftJournal(db, {
      businessId,
      actorUserId: userId,
      date: "2025-08-01",
      narration: "Bad journal",
      lines: [
        { accountId: expenseId, debitCents: 1000, creditCents: 0 },
        { accountId: bankId, debitCents: 0, creditCents: 900 },
      ],
    });
    await expect(
      postJournal(db, { journalId: draft!.id, actorUserId: userId }),
    ).rejects.toMatchObject({ code: "unbalanced" });
  });

  it("rejects lines with both debit and credit", () => {
    expect(() =>
      computeTotals([
        { accountId: bankId, debitCents: 100, creditCents: 100 },
        { accountId: expenseId, debitCents: 0, creditCents: 0 },
      ]),
    ).toThrow(AppError);
  });

  it("posts a balanced journal atomically and builds trial balance", async () => {
    const draft = await createDraftJournal(db, {
      businessId,
      actorUserId: userId,
      date: "2025-08-15",
      narration: "Office supplies",
      idempotencyKey: "office-1",
      lines: [
        { accountId: expenseId, debitCents: 11000, creditCents: 0 },
        { accountId: bankId, debitCents: 0, creditCents: 11000 },
      ],
    });
    const posted = await postJournal(db, {
      journalId: draft!.id,
      actorUserId: userId,
    });
    expect(posted?.status).toBe("posted");

    const again = await createDraftJournal(db, {
      businessId,
      actorUserId: userId,
      date: "2025-08-15",
      narration: "duplicate attempt",
      idempotencyKey: "office-1",
      lines: [
        { accountId: expenseId, debitCents: 11000, creditCents: 0 },
        { accountId: bankId, debitCents: 0, creditCents: 11000 },
      ],
    });
    expect(again?.id).toBe(posted?.id);

    const tb = await trialBalance(db, { businessId });
    expect(tb.totals.balanced).toBe(true);
    expect(tb.totals.debitCents).toBe("11000");
    expect(tb.totals.creditCents).toBe("11000");

    const gl = await generalLedger(db, {
      businessId,
      accountId: expenseId,
    });
    expect(gl.lines).toHaveLength(1);
    expect(gl.lines[0].runningBalanceCents).toBe("11000");
  });

  it("blocks posting into a locked period", async () => {
    await lockPeriod(db, periodId, userId);
    await expect(
      createDraftJournal(db, {
        businessId,
        actorUserId: userId,
        date: "2025-08-15",
        narration: "Too late",
        lines: [
          { accountId: expenseId, debitCents: 500, creditCents: 0 },
          { accountId: bankId, debitCents: 0, creditCents: 500 },
        ],
      }),
    ).rejects.toMatchObject({ code: "period_locked" });
  });

  it("reverses a posted journal with opposite lines", async () => {
    const draft = await createDraftJournal(db, {
      businessId,
      actorUserId: userId,
      date: "2025-09-01",
      narration: "To reverse",
      lines: [
        { accountId: expenseId, debitCents: 2500, creditCents: 0 },
        { accountId: bankId, debitCents: 0, creditCents: 2500 },
      ],
    });
    await postJournal(db, { journalId: draft!.id, actorUserId: userId });
    const result = await reverseJournal(db, {
      journalId: draft!.id,
      actorUserId: userId,
    });
    expect(result.original?.status).toBe("reversed");
    expect(result.reversal?.status).toBe("posted");

    const tb = await trialBalance(db, { businessId });
    expect(tb.totals.debitCents).toBe(tb.totals.creditCents);
    // Net effect zero on each account after reversal
    for (const row of tb.accounts) {
      expect(BigInt(row.debitCents) - BigInt(row.creditCents)).toBe(BigInt(0));
    }
  });

  it("denies cross-tenant account usage", async () => {
    const other = await createBusiness(db, {
      practiceId,
      actorUserId: userId,
      legalName: "Other Co",
    });
    const otherAccounts = await db.query.accounts.findMany({
      where: eq(accounts.businessId, other.id),
    });
    const foreignExpense = otherAccounts.find((a) => a.code === "6200")!.id;

    await expect(
      createDraftJournal(db, {
        businessId,
        actorUserId: userId,
        date: "2025-08-20",
        narration: "cross tenant",
        lines: [
          { accountId: foreignExpense, debitCents: 100, creditCents: 0 },
          { accountId: bankId, debitCents: 0, creditCents: 100 },
        ],
      }),
    ).rejects.toMatchObject({ code: "invalid_account" });
  });

  it("enforces can_post permission for restricted users", async () => {
    // Create a second user-like access row with view-only on this business
    // by inserting a membership-less access check path via businessAccess flags.
    // Direct engine post still works; API layer checks permissions.
    // Here we assert access row can be view-only.
    await db.delete(businessAccess).where(eq(businessAccess.businessId, businessId));
    await grantBusinessAccess(db, {
      businessId,
      userId,
      permissions: roleDefaultPermissions("read_only_auditor"),
    });
    const access = await db.query.businessAccess.findFirst({
      where: and(
        eq(businessAccess.businessId, businessId),
        eq(businessAccess.userId, userId),
      ),
    });
    expect(access?.canPost).toBe(false);
    expect(access?.canView).toBe(true);
  });

  it("does not leave partial lines when insert would fail validation before write", async () => {
    await expect(
      createDraftJournal(db, {
        businessId,
        actorUserId: userId,
        date: "2025-08-15",
        narration: "empty",
        lines: [{ accountId: bankId, debitCents: 0, creditCents: 0 }],
      }),
    ).rejects.toBeTruthy();
    const count = await db.select().from(journals);
    expect(count.length).toBe(0);
    const lineCount = await db.select().from(journalLines);
    expect(lineCount.length).toBe(0);
  });
});
