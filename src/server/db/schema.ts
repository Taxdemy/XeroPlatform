import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const practiceRoleEnum = pgEnum("practice_role", [
  "practice_owner",
  "practice_admin",
  "accountant",
  "senior_accountant",
  "bookkeeper",
  "payroll_specialist",
  "business_owner",
  "business_manager",
  "employee",
  "external_adviser",
  "client_portal_user",
  "read_only_auditor",
]);

export const entityTypeEnum = pgEnum("entity_type", [
  "sole_trader",
  "company",
  "trust",
  "partnership",
  "smsf",
  "other",
]);

export const gstBasisEnum = pgEnum("gst_basis", ["cash", "accrual"]);

export const basCycleEnum = pgEnum("bas_cycle", [
  "monthly",
  "quarterly",
  "annually",
]);

export const basReportingMethodEnum = pgEnum("bas_reporting_method", [
  "simpler",
  "full",
  "instalment",
]);

export const accountTypeEnum = pgEnum("account_type", [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
]);

export const periodStatusEnum = pgEnum("period_status", [
  "open",
  "locked",
  "closed",
]);

export const journalStatusEnum = pgEnum("journal_status", [
  "draft",
  "posted",
  "reversed",
]);

export const practices = pgTable(
  "practices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("practices_slug_uidx").on(t.slug)],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("users_email_uidx").on(t.email)],
);

export const practiceMemberships = pgTable(
  "practice_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: practiceRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("practice_memberships_practice_user_uidx").on(
      t.practiceId,
      t.userId,
    ),
  ],
);

export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  practiceId: uuid("practice_id")
    .notNull()
    .references(() => practices.id, { onDelete: "cascade" }),
  legalName: varchar("legal_name", { length: 300 }).notNull(),
  tradingName: varchar("trading_name", { length: 300 }),
  abn: varchar("abn", { length: 14 }),
  acn: varchar("acn", { length: 12 }),
  entityType: entityTypeEnum("entity_type").notNull().default("company"),
  gstRegistered: boolean("gst_registered").notNull().default(true),
  gstBasis: gstBasisEnum("gst_basis").notNull().default("accrual"),
  basCycle: basCycleEnum("bas_cycle").notNull().default("quarterly"),
  basReportingMethod: basReportingMethodEnum("bas_reporting_method")
    .notNull()
    .default("simpler"),
  financialYearEndMonth: integer("financial_year_end_month")
    .notNull()
    .default(6),
  financialYearEndDay: integer("financial_year_end_day").notNull().default(30),
  timezone: varchar("timezone", { length: 64 })
    .notNull()
    .default("Australia/Sydney"),
  currency: varchar("currency", { length: 3 }).notNull().default("AUD"),
  conversionDate: date("conversion_date"),
  addresses: jsonb("addresses").$type<Record<string, unknown>>().default({}),
  contacts: jsonb("contacts").$type<Record<string, unknown>>().default({}),
  payrollIdentifiers: jsonb("payroll_identifiers")
    .$type<Record<string, unknown>>()
    .default({}),
  accountingPolicies: jsonb("accounting_policies")
    .$type<Record<string, unknown>>()
    .default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const businessAccess = pgTable(
  "business_access",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    canView: boolean("can_view").notNull().default(true),
    canEdit: boolean("can_edit").notNull().default(false),
    canPost: boolean("can_post").notNull().default(false),
    canApprove: boolean("can_approve").notNull().default(false),
    canLodge: boolean("can_lodge").notNull().default(false),
    canPay: boolean("can_pay").notNull().default(false),
    canExport: boolean("can_export").notNull().default(false),
    canDelete: boolean("can_delete").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("business_access_business_user_uidx").on(
      t.businessId,
      t.userId,
    ),
  ],
);

export const taxCodes = pgTable(
  "tax_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 32 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    rateBp: integer("rate_bp").notNull().default(0),
    taxType: varchar("tax_type", { length: 64 }).notNull(),
    basField: varchar("bas_field", { length: 32 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("tax_codes_business_code_uidx").on(t.businessId, t.code),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 32 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    type: accountTypeEnum("type").notNull(),
    subtype: varchar("subtype", { length: 64 }),
    taxCodeId: uuid("tax_code_id").references(() => taxCodes.id, {
      onDelete: "set null",
    }),
    parentId: uuid("parent_id"),
    isSystem: boolean("is_system").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("accounts_business_code_uidx").on(t.businessId, t.code),
  ],
);

export const accountingPeriods = pgTable(
  "accounting_periods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: periodStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("accounting_periods_business_name_uidx").on(
      t.businessId,
      t.name,
    ),
  ],
);

export const journals = pgTable(
  "journals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    journalNumber: integer("journal_number").notNull(),
    date: date("date").notNull(),
    narration: text("narration").notNull().default(""),
    sourceType: varchar("source_type", { length: 64 })
      .notNull()
      .default("manual"),
    sourceId: uuid("source_id"),
    status: journalStatusEnum("status").notNull().default("draft"),
    idempotencyKey: varchar("idempotency_key", { length: 200 }),
    periodId: uuid("period_id").references(() => accountingPeriods.id, {
      onDelete: "set null",
    }),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    postedBy: uuid("posted_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reversalOfJournalId: uuid("reversal_of_journal_id"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("journals_business_number_uidx").on(
      t.businessId,
      t.journalNumber,
    ),
    uniqueIndex("journals_business_idempotency_uidx")
      .on(t.businessId, t.idempotencyKey)
      .where(sql`${t.idempotencyKey} IS NOT NULL`),
  ],
);

export const journalLines = pgTable(
  "journal_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    journalId: uuid("journal_id")
      .notNull()
      .references(() => journals.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    lineNo: integer("line_no").notNull(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    description: text("description").notNull().default(""),
    debitCents: bigint("debit_cents", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    creditCents: bigint("credit_cents", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    taxCodeId: uuid("tax_code_id").references(() => taxCodes.id, {
      onDelete: "set null",
    }),
    taxCents: bigint("tax_cents", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
  },
  (t) => [
    uniqueIndex("journal_lines_journal_line_uidx").on(t.journalId, t.lineNo),
  ],
);

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  practiceId: uuid("practice_id").references(() => practices.id, {
    onDelete: "set null",
  }),
  businessId: uuid("business_id").references(() => businesses.id, {
    onDelete: "set null",
  }),
  actorUserId: uuid("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 120 }).notNull(),
  entityId: uuid("entity_id"),
  beforeJson: jsonb("before_json"),
  afterJson: jsonb("after_json"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("sessions_token_hash_uidx").on(t.tokenHash)],
);

export type PracticeRole =
  (typeof practiceRoleEnum.enumValues)[number];
export type AccountType = (typeof accountTypeEnum.enumValues)[number];
export type JournalStatus = (typeof journalStatusEnum.enumValues)[number];
