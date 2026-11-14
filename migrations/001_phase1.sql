DO $$ BEGIN
  CREATE TYPE practice_role AS ENUM (
    'practice_owner', 'practice_admin', 'accountant', 'senior_accountant',
    'bookkeeper', 'payroll_specialist', 'business_owner', 'business_manager',
    'employee', 'external_adviser', 'client_portal_user', 'read_only_auditor'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE entity_type AS ENUM (
    'sole_trader', 'company', 'trust', 'partnership', 'smsf', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE gst_basis AS ENUM ('cash', 'accrual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE bas_cycle AS ENUM ('monthly', 'quarterly', 'annually');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE bas_reporting_method AS ENUM ('simpler', 'full', 'instalment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM (
    'asset', 'liability', 'equity', 'revenue', 'expense'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE period_status AS ENUM ('open', 'locked', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE journal_status AS ENUM ('draft', 'posted', 'reversed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  slug varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS practices_slug_uidx ON practices(slug);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL,
  password_hash text NOT NULL,
  full_name varchar(200) NOT NULL,
  is_platform_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uidx ON users(email);

CREATE TABLE IF NOT EXISTS practice_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role practice_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS practice_memberships_practice_user_uidx
  ON practice_memberships(practice_id, user_id);

CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  legal_name varchar(300) NOT NULL,
  trading_name varchar(300),
  abn varchar(14),
  acn varchar(12),
  entity_type entity_type NOT NULL DEFAULT 'company',
  gst_registered boolean NOT NULL DEFAULT true,
  gst_basis gst_basis NOT NULL DEFAULT 'accrual',
  bas_cycle bas_cycle NOT NULL DEFAULT 'quarterly',
  bas_reporting_method bas_reporting_method NOT NULL DEFAULT 'simpler',
  financial_year_end_month integer NOT NULL DEFAULT 6,
  financial_year_end_day integer NOT NULL DEFAULT 30,
  timezone varchar(64) NOT NULL DEFAULT 'Australia/Sydney',
  currency varchar(3) NOT NULL DEFAULT 'AUD',
  conversion_date date,
  addresses jsonb DEFAULT '{}'::jsonb,
  contacts jsonb DEFAULT '{}'::jsonb,
  payroll_identifiers jsonb DEFAULT '{}'::jsonb,
  accounting_policies jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_view boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT false,
  can_post boolean NOT NULL DEFAULT false,
  can_approve boolean NOT NULL DEFAULT false,
  can_lodge boolean NOT NULL DEFAULT false,
  can_pay boolean NOT NULL DEFAULT false,
  can_export boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS business_access_business_user_uidx
  ON business_access(business_id, user_id);

CREATE TABLE IF NOT EXISTS tax_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code varchar(32) NOT NULL,
  name varchar(120) NOT NULL,
  rate_bp integer NOT NULL DEFAULT 0,
  tax_type varchar(64) NOT NULL,
  bas_field varchar(32),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS tax_codes_business_code_uidx
  ON tax_codes(business_id, code);

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code varchar(32) NOT NULL,
  name varchar(200) NOT NULL,
  type account_type NOT NULL,
  subtype varchar(64),
  tax_code_id uuid REFERENCES tax_codes(id) ON DELETE SET NULL,
  parent_id uuid,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS accounts_business_code_uidx
  ON accounts(business_id, code);

CREATE TABLE IF NOT EXISTS accounting_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status period_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS accounting_periods_business_name_uidx
  ON accounting_periods(business_id, name);

CREATE TABLE IF NOT EXISTS journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  journal_number integer NOT NULL,
  date date NOT NULL,
  narration text NOT NULL DEFAULT '',
  source_type varchar(64) NOT NULL DEFAULT 'manual',
  source_id uuid,
  status journal_status NOT NULL DEFAULT 'draft',
  idempotency_key varchar(200),
  period_id uuid REFERENCES accounting_periods(id) ON DELETE SET NULL,
  posted_at timestamptz,
  posted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reversal_of_journal_id uuid,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS journals_business_number_uidx
  ON journals(business_id, journal_number);
CREATE UNIQUE INDEX IF NOT EXISTS journals_business_idempotency_uidx
  ON journals(business_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id uuid NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  line_no integer NOT NULL,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  description text NOT NULL DEFAULT '',
  debit_cents bigint NOT NULL DEFAULT 0,
  credit_cents bigint NOT NULL DEFAULT 0,
  tax_code_id uuid REFERENCES tax_codes(id) ON DELETE SET NULL,
  tax_cents bigint NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS journal_lines_journal_line_uidx
  ON journal_lines(journal_id, line_no);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE SET NULL,
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(120) NOT NULL,
  entity_type varchar(120) NOT NULL,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash varchar(128) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_uidx ON sessions(token_hash);
