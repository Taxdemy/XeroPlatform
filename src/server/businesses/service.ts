import { eq } from "drizzle-orm";
import type { AppDatabase } from "../db/client";
import {
  accountingPeriods,
  businesses,
  type entityTypeEnum,
  type gstBasisEnum,
  type basCycleEnum,
  type basReportingMethodEnum,
} from "../db/schema";
import { grantBusinessAccess, roleDefaultPermissions } from "../auth/service";
import { writeAudit } from "../audit";
import { seedDefaultChartOfAccounts, seedDefaultTaxCodes } from "../accounting/seeds";
import { AppError } from "../lib/errors";

type EntityType = (typeof entityTypeEnum.enumValues)[number];
type GstBasis = (typeof gstBasisEnum.enumValues)[number];
type BasCycle = (typeof basCycleEnum.enumValues)[number];
type BasReportingMethod = (typeof basReportingMethodEnum.enumValues)[number];

export async function createBusiness(
  db: AppDatabase,
  input: {
    practiceId: string;
    actorUserId: string;
    legalName: string;
    tradingName?: string;
    abn?: string;
    acn?: string;
    entityType?: EntityType;
    gstRegistered?: boolean;
    gstBasis?: GstBasis;
    basCycle?: BasCycle;
    basReportingMethod?: BasReportingMethod;
    conversionDate?: string;
    openPeriod?: { name: string; startDate: string; endDate: string };
  },
) {
  const [business] = await db
    .insert(businesses)
    .values({
      practiceId: input.practiceId,
      legalName: input.legalName.trim(),
      tradingName: input.tradingName?.trim() || null,
      abn: input.abn?.replace(/\s/g, "") || null,
      acn: input.acn?.replace(/\s/g, "") || null,
      entityType: input.entityType ?? "company",
      gstRegistered: input.gstRegistered ?? true,
      gstBasis: input.gstBasis ?? "accrual",
      basCycle: input.basCycle ?? "quarterly",
      basReportingMethod: input.basReportingMethod ?? "simpler",
      conversionDate: input.conversionDate ?? null,
    })
    .returning();

  await grantBusinessAccess(db, {
    businessId: business.id,
    userId: input.actorUserId,
    permissions: roleDefaultPermissions("practice_owner"),
  });

  await seedDefaultTaxCodes(db, business.id);
  await seedDefaultChartOfAccounts(db, business.id);

  const period =
    input.openPeriod ??
    ({
      name: "FY2026",
      startDate: "2025-07-01",
      endDate: "2026-06-30",
    } as const);

  await db.insert(accountingPeriods).values({
    businessId: business.id,
    name: period.name,
    startDate: period.startDate,
    endDate: period.endDate,
    status: "open",
  });

  await writeAudit(db, {
    practiceId: input.practiceId,
    businessId: business.id,
    actorUserId: input.actorUserId,
    action: "business.created",
    entityType: "business",
    entityId: business.id,
    after: { legalName: business.legalName },
  });

  return business;
}

export async function listBusinessesForPractice(
  db: AppDatabase,
  practiceId: string,
) {
  return db.query.businesses.findMany({
    where: eq(businesses.practiceId, practiceId),
  });
}

export async function updateBusiness(
  db: AppDatabase,
  businessId: string,
  patch: Partial<{
    legalName: string;
    tradingName: string | null;
    abn: string | null;
    acn: string | null;
    gstRegistered: boolean;
    gstBasis: GstBasis;
    basCycle: BasCycle;
    basReportingMethod: BasReportingMethod;
    conversionDate: string | null;
  }>,
  actorUserId: string,
) {
  const existing = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
  });
  if (!existing) throw new AppError("not_found", "Business not found", 404);

  const [updated] = await db
    .update(businesses)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(businesses.id, businessId))
    .returning();

  await writeAudit(db, {
    practiceId: existing.practiceId,
    businessId,
    actorUserId,
    action: "business.updated",
    entityType: "business",
    entityId: businessId,
    before: existing,
    after: updated,
  });

  return updated;
}

export async function createPeriod(
  db: AppDatabase,
  input: {
    businessId: string;
    name: string;
    startDate: string;
    endDate: string;
    actorUserId: string;
  },
) {
  if (input.endDate < input.startDate) {
    throw new AppError("invalid_period", "endDate must be on or after startDate");
  }
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, input.businessId),
  });
  if (!business) throw new AppError("not_found", "Business not found", 404);

  const [period] = await db
    .insert(accountingPeriods)
    .values({
      businessId: input.businessId,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "open",
    })
    .returning();

  await writeAudit(db, {
    practiceId: business.practiceId,
    businessId: input.businessId,
    actorUserId: input.actorUserId,
    action: "period.created",
    entityType: "accounting_period",
    entityId: period.id,
    after: period,
  });

  return period;
}

export async function lockPeriod(
  db: AppDatabase,
  periodId: string,
  actorUserId: string,
) {
  const period = await db.query.accountingPeriods.findFirst({
    where: eq(accountingPeriods.id, periodId),
  });
  if (!period) throw new AppError("not_found", "Period not found", 404);

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, period.businessId),
  });

  const [updated] = await db
    .update(accountingPeriods)
    .set({ status: "locked" })
    .where(eq(accountingPeriods.id, periodId))
    .returning();

  await writeAudit(db, {
    practiceId: business?.practiceId,
    businessId: period.businessId,
    actorUserId,
    action: "period.locked",
    entityType: "accounting_period",
    entityId: periodId,
  });

  return updated;
}
