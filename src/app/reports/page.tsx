import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { formatAudFromCents } from "@/lib/format";
import { getDb } from "@/server/db/client";
import { getUserBySession } from "@/server/auth/service";
import { requireBusinessAccess } from "@/server/access/service";
import { trialBalance } from "@/server/reports/service";
import { readSessionToken } from "@/server/http/session";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ businessId?: string }> };

export default async function ReportsPage({ searchParams }: Props) {
  const { businessId } = await searchParams;
  if (!businessId) {
    return (
      <main className="aa-shell">
        <AppNav />
        <p>
          Open a business ledger first, then append <code>?businessId=…</code>{" "}
          or use the dashboard link.
        </p>
      </main>
    );
  }

  const db = await getDb();
  const user = await getUserBySession(db, await readSessionToken());
  if (!user) redirect("/login");
  await requireBusinessAccess(db, user, businessId);
  const report = await trialBalance(db, { businessId });

  return (
    <main className="aa-shell">
      <AppNav />
      <h1 className="text-2xl font-semibold">Trial balance</h1>
      <p className="aa-muted mt-2 text-sm">
        Posted journal history. Totals must balance.
      </p>
      <table className="aa-table mt-6">
        <thead>
          <tr>
            <th>Code</th>
            <th>Account</th>
            <th>Type</th>
            <th>Debit</th>
            <th>Credit</th>
          </tr>
        </thead>
        <tbody>
          {report.accounts.map((r) => (
            <tr key={r.code}>
              <td>{r.code}</td>
              <td>{r.name}</td>
              <td>{r.type}</td>
              <td>{formatAudFromCents(r.debitCents)}</td>
              <td>{formatAudFromCents(r.creditCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-sm font-semibold">
        Totals {formatAudFromCents(report.totals.debitCents)} /{" "}
        {formatAudFromCents(report.totals.creditCents)} —{" "}
        {report.totals.balanced ? "balanced" : "OUT OF BALANCE"}
      </p>
    </main>
  );
}
