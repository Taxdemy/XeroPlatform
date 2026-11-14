import { eq } from "drizzle-orm";
import type { AppDatabase } from "../db/client";
import { accounts, taxCodes, type AccountType } from "../db/schema";

const DEFAULT_TAX_CODES = [
  {
    code: "GST",
    name: "GST on Income/Expenses",
    rateBp: 1000,
    taxType: "taxable",
    basField: "G1",
  },
  {
    code: "GSTFREE",
    name: "GST Free",
    rateBp: 0,
    taxType: "gst_free",
    basField: "G3",
  },
  {
    code: "EXPORT",
    name: "GST Free Exports",
    rateBp: 0,
    taxType: "export",
    basField: "G2",
  },
  {
    code: "INPUT",
    name: "Input Taxed",
    rateBp: 0,
    taxType: "input_taxed",
    basField: "G4",
  },
  {
    code: "CAPEX",
    name: "GST on Capital",
    rateBp: 1000,
    taxType: "capital",
    basField: "G10",
  },
  {
    code: "BASEXCLUDED",
    name: "BAS Excluded",
    rateBp: 0,
    taxType: "bas_excluded",
    basField: null,
  },
] as const;

type SeedAccount = {
  code: string;
  name: string;
  type: AccountType;
  subtype: string;
  taxCode?: string;
  system?: boolean;
};

const DEFAULT_COA: SeedAccount[] = [
  { code: "1000", name: "Business Bank Account", type: "asset", subtype: "bank", taxCode: "BASEXCLUDED", system: true },
  { code: "1200", name: "Accounts Receivable", type: "asset", subtype: "current", taxCode: "BASEXCLUDED", system: true },
  { code: "1300", name: "GST Receivable (Input Tax Credits)", type: "asset", subtype: "current", taxCode: "BASEXCLUDED", system: true },
  { code: "2000", name: "Accounts Payable", type: "liability", subtype: "current", taxCode: "BASEXCLUDED", system: true },
  { code: "2100", name: "GST Payable", type: "liability", subtype: "current", taxCode: "BASEXCLUDED", system: true },
  { code: "2200", name: "PAYG Withholding Payable", type: "liability", subtype: "current", taxCode: "BASEXCLUDED", system: true },
  { code: "2300", name: "Superannuation Payable", type: "liability", subtype: "current", taxCode: "BASEXCLUDED", system: true },
  { code: "3000", name: "Owner Equity / Retained Earnings", type: "equity", subtype: "equity", taxCode: "BASEXCLUDED", system: true },
  { code: "4000", name: "Sales", type: "revenue", subtype: "income", taxCode: "GST" },
  { code: "4100", name: "Other Income", type: "revenue", subtype: "income", taxCode: "GSTFREE" },
  { code: "5000", name: "Cost of Goods Sold", type: "expense", subtype: "direct_costs", taxCode: "GST" },
  { code: "6000", name: "Advertising", type: "expense", subtype: "expense", taxCode: "GST" },
  { code: "6100", name: "Bank Fees", type: "expense", subtype: "expense", taxCode: "BASEXCLUDED" },
  { code: "6200", name: "Office Expenses", type: "expense", subtype: "expense", taxCode: "GST" },
  { code: "6300", name: "Rent", type: "expense", subtype: "expense", taxCode: "GST" },
  { code: "6400", name: "Wages and Salaries", type: "expense", subtype: "expense", taxCode: "BASEXCLUDED" },
  { code: "6500", name: "Superannuation Expense", type: "expense", subtype: "expense", taxCode: "BASEXCLUDED" },
];

export async function seedDefaultTaxCodes(db: AppDatabase, businessId: string) {
  const existing = await db.query.taxCodes.findMany({
    where: eq(taxCodes.businessId, businessId),
  });
  if (existing.length > 0) return existing;

  const inserted = await db
    .insert(taxCodes)
    .values(
      DEFAULT_TAX_CODES.map((t) => ({
        businessId,
        code: t.code,
        name: t.name,
        rateBp: t.rateBp,
        taxType: t.taxType,
        basField: t.basField,
      })),
    )
    .returning();
  return inserted;
}

export async function seedDefaultChartOfAccounts(
  db: AppDatabase,
  businessId: string,
) {
  const existing = await db.query.accounts.findMany({
    where: eq(accounts.businessId, businessId),
  });
  if (existing.length > 0) return existing;

  const codes = await seedDefaultTaxCodes(db, businessId);
  const byCode = new Map(codes.map((c) => [c.code, c.id]));

  const inserted = await db
    .insert(accounts)
    .values(
      DEFAULT_COA.map((a) => ({
        businessId,
        code: a.code,
        name: a.name,
        type: a.type,
        subtype: a.subtype,
        taxCodeId: a.taxCode ? byCode.get(a.taxCode) ?? null : null,
        isSystem: a.system ?? false,
      })),
    )
    .returning();
  return inserted;
}
