import { and, eq, gt } from "drizzle-orm";
import type { AppDatabase } from "../db/client";
import {
  businessAccess,
  practiceMemberships,
  practices,
  sessions,
  users,
  type PracticeRole,
} from "../db/schema";
import { writeAudit } from "../audit";
import {
  createSessionToken,
  hashPassword,
  hashToken,
  slugify,
  verifyPassword,
} from "../lib/crypto";
import { AppError } from "../lib/errors";

const SESSION_DAYS = 14;

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  isPlatformAdmin: boolean;
};

export async function registerPracticeOwner(
  db: AppDatabase,
  input: {
    email: string;
    password: string;
    fullName: string;
    practiceName: string;
  },
): Promise<{ user: AuthUser; practiceId: string; sessionToken: string }> {
  const email = input.email.trim().toLowerCase();
  if (input.password.length < 10) {
    throw new AppError("weak_password", "Password must be at least 10 characters");
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    throw new AppError("email_taken", "Email already registered", 409);
  }

  const baseSlug = slugify(input.practiceName) || "practice";
  let slug = baseSlug;
  let n = 1;
  while (await db.query.practices.findFirst({ where: eq(practices.slug, slug) })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashPassword(input.password),
      fullName: input.fullName.trim(),
    })
    .returning();

  const [practice] = await db
    .insert(practices)
    .values({ name: input.practiceName.trim(), slug })
    .returning();

  await db.insert(practiceMemberships).values({
    practiceId: practice.id,
    userId: user.id,
    role: "practice_owner",
  });

  const sessionToken = await createSession(db, user.id);

  await writeAudit(db, {
    practiceId: practice.id,
    actorUserId: user.id,
    action: "practice.registered",
    entityType: "practice",
    entityId: practice.id,
    after: { slug: practice.slug, name: practice.name },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isPlatformAdmin: user.isPlatformAdmin,
    },
    practiceId: practice.id,
    sessionToken,
  };
}

export async function login(
  db: AppDatabase,
  input: { email: string; password: string },
): Promise<{ user: AuthUser; sessionToken: string }> {
  const email = input.email.trim().toLowerCase();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new AppError("invalid_credentials", "Invalid email or password", 401);
  }
  const sessionToken = await createSession(db, user.id);
  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isPlatformAdmin: user.isPlatformAdmin,
    },
    sessionToken,
  };
}

export async function logout(db: AppDatabase, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

export async function getUserBySession(
  db: AppDatabase,
  token: string | undefined | null,
): Promise<AuthUser | null> {
  if (!token) return null;
  const row = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.tokenHash, hashToken(token)),
      gt(sessions.expiresAt, new Date()),
    ),
  });
  if (!row) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.id, row.userId),
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isPlatformAdmin: user.isPlatformAdmin,
  };
}

async function createSession(db: AppDatabase, userId: string): Promise<string> {
  const token = createSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  return token;
}

export async function listMemberships(db: AppDatabase, userId: string) {
  return db
    .select({
      membershipId: practiceMemberships.id,
      practiceId: practices.id,
      practiceName: practices.name,
      practiceSlug: practices.slug,
      role: practiceMemberships.role,
    })
    .from(practiceMemberships)
    .innerJoin(practices, eq(practices.id, practiceMemberships.practiceId))
    .where(eq(practiceMemberships.userId, userId));
}

export async function grantBusinessAccess(
  db: AppDatabase,
  input: {
    businessId: string;
    userId: string;
    permissions: Partial<{
      canView: boolean;
      canEdit: boolean;
      canPost: boolean;
      canApprove: boolean;
      canLodge: boolean;
      canPay: boolean;
      canExport: boolean;
      canDelete: boolean;
    }>;
  },
) {
  const perms = {
    canView: true,
    canEdit: false,
    canPost: false,
    canApprove: false,
    canLodge: false,
    canPay: false,
    canExport: false,
    canDelete: false,
    ...input.permissions,
  };
  await db.insert(businessAccess).values({
    businessId: input.businessId,
    userId: input.userId,
    ...perms,
  });
}

export function roleDefaultPermissions(role: PracticeRole) {
  switch (role) {
    case "practice_owner":
    case "practice_admin":
    case "senior_accountant":
      return {
        canView: true,
        canEdit: true,
        canPost: true,
        canApprove: true,
        canLodge: true,
        canPay: true,
        canExport: true,
        canDelete: true,
      };
    case "accountant":
    case "bookkeeper":
      return {
        canView: true,
        canEdit: true,
        canPost: true,
        canApprove: false,
        canLodge: false,
        canPay: false,
        canExport: true,
        canDelete: false,
      };
    case "payroll_specialist":
      return {
        canView: true,
        canEdit: true,
        canPost: true,
        canApprove: false,
        canLodge: false,
        canPay: true,
        canExport: true,
        canDelete: false,
      };
    case "business_owner":
    case "business_manager":
      return {
        canView: true,
        canEdit: true,
        canPost: false,
        canApprove: true,
        canLodge: false,
        canPay: true,
        canExport: true,
        canDelete: false,
      };
    case "read_only_auditor":
    case "external_adviser":
    case "client_portal_user":
    case "employee":
    default:
      return {
        canView: true,
        canEdit: false,
        canPost: false,
        canApprove: false,
        canLodge: false,
        canPay: false,
        canExport: false,
        canDelete: false,
      };
  }
}
