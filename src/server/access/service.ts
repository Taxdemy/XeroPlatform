import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "../db/client";
import {
  businessAccess,
  businesses,
  practiceMemberships,
} from "../db/schema";
import type { AuthUser } from "../auth/service";
import { AppError } from "../lib/errors";

export type BusinessPermission =
  | "canView"
  | "canEdit"
  | "canPost"
  | "canApprove"
  | "canLodge"
  | "canPay"
  | "canExport"
  | "canDelete";

const COLUMN: Record<BusinessPermission, keyof typeof businessAccess.$inferSelect> = {
  canView: "canView",
  canEdit: "canEdit",
  canPost: "canPost",
  canApprove: "canApprove",
  canLodge: "canLodge",
  canPay: "canPay",
  canExport: "canExport",
  canDelete: "canDelete",
};

export async function requirePracticeMember(
  db: AppDatabase,
  user: AuthUser,
  practiceId: string,
) {
  if (user.isPlatformAdmin) {
    return { role: "practice_owner" as const };
  }
  const membership = await db.query.practiceMemberships.findFirst({
    where: and(
      eq(practiceMemberships.practiceId, practiceId),
      eq(practiceMemberships.userId, user.id),
    ),
  });
  if (!membership) {
    throw new AppError("not_found", "Practice not found", 404);
  }
  return membership;
}

export async function requireBusinessAccess(
  db: AppDatabase,
  user: AuthUser,
  businessId: string,
  permission: BusinessPermission = "canView",
) {
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
  });
  if (!business || !business.isActive) {
    throw new AppError("not_found", "Business not found", 404);
  }

  if (user.isPlatformAdmin) {
    return { business, access: null as null };
  }

  const membership = await db.query.practiceMemberships.findFirst({
    where: and(
      eq(practiceMemberships.practiceId, business.practiceId),
      eq(practiceMemberships.userId, user.id),
    ),
  });
  if (!membership) {
    throw new AppError("not_found", "Business not found", 404);
  }

  const access = await db.query.businessAccess.findFirst({
    where: and(
      eq(businessAccess.businessId, businessId),
      eq(businessAccess.userId, user.id),
    ),
  });

  // Practice owners/admins get full access without explicit row.
  if (
    membership.role === "practice_owner" ||
    membership.role === "practice_admin"
  ) {
    return { business, access, membership };
  }

  if (!access || !access.canView) {
    throw new AppError("not_found", "Business not found", 404);
  }

  const key = COLUMN[permission];
  if (permission !== "canView" && access && !access[key]) {
    throw new AppError("forbidden", `Missing permission: ${permission}`, 403);
  }

  return { business, access, membership };
}
