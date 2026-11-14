import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { getDb } from "@/server/db/client";
import { accounts } from "@/server/db/schema";
import { getUserBySession } from "@/server/auth/service";
import { requireBusinessAccess } from "@/server/access/service";
import { listJournals } from "@/server/ledger/engine";
import { readSessionToken } from "@/server/http/session";
import { ManualJournalForm } from "./ManualJournalForm";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ businessId?: string }> };

export default async function AccountingPage({ searchParams }: Props) {
  const { businessId } = await searchParams;
  if (!businessId) {
    return (
      <main className="aa-shell">
        <AppNav />
        <p>Select a business from the dashboard.</p>
      </main>
    );
  }

  const db = await getDb();
  const user = await getUserBySession(db, await readSessionToken());
  if (!user) redirect("/login");
  await requireBusinessAccess(db, user, businessId);

  const accountRows = await db.query.accounts.findMany({
    where: eq(accounts.businessId, businessId),
  });
  accountRows.sort((a, b) => a.code.localeCompare(b.code));
  const journals = await listJournals(db, businessId);

  return (
    <main className="aa-shell">
      <AppNav />
      <h1 className="text-2xl font-semibold">Accounting</h1>
      <p className="aa-muted mt-2 text-sm">
        Manual journals with balance validation, period locks, and immutable
        posted history.
      </p>

      <section className="aa-card-free mt-8 grid gap-8 lg:grid-cols-2">
        <ManualJournalForm
          businessId={businessId}
          accounts={accountRows.map((a) => ({
            id: a.id,
            code: a.code,
            name: a.name,
          }))}
        />

        <div>
          <h2 className="text-lg font-semibold">Journals</h2>
          <table className="aa-table mt-4">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Narration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {journals.map((j) => (
                <tr key={j.id}>
                  <td>{j.journalNumber}</td>
                  <td>{j.date}</td>
                  <td>{j.narration}</td>
                  <td>
                    <span className={`aa-status aa-status-${j.status}`}>
                      {j.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
