import type { AppDatabase } from "./db/client";
import { auditEvents } from "./db/schema";

export async function writeAudit(
  db: AppDatabase,
  event: {
    practiceId?: string | null;
    businessId?: string | null;
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    before?: unknown;
    after?: unknown;
  },
): Promise<void> {
  await db.insert(auditEvents).values({
    practiceId: event.practiceId ?? null,
    businessId: event.businessId ?? null,
    actorUserId: event.actorUserId ?? null,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId ?? null,
    beforeJson: event.before ?? null,
    afterJson: event.after ?? null,
  });
}
