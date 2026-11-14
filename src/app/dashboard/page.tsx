import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { getDb } from "@/server/db/client";
import { listMemberships, getUserBySession } from "@/server/auth/service";
import { listBusinessesForPractice } from "@/server/businesses/service";
import { readSessionToken } from "@/server/http/session";
import { CreateBusinessForm } from "./CreateBusinessForm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = await getDb();
  const user = await getUserBySession(db, await readSessionToken());
  if (!user) redirect("/login");

  const memberships = await listMemberships(db, user.id);
  const practice = memberships[0];
  if (!practice) {
    return (
      <main className="aa-shell">
        <AppNav />
        <p>No practice membership found.</p>
      </main>
    );
  }

  const businesses = await listBusinessesForPractice(db, practice.practiceId);

  return (
    <main className="aa-shell">
      <AppNav practiceName={practice.practiceName} />
      <section>
        <h1 className="text-2xl font-semibold">Practice dashboard</h1>
        <p className="aa-muted mt-2 max-w-2xl text-sm">
          Manage client entities. Each business gets an Australian chart of
          accounts, GST tax codes, and an open financial year period.
        </p>
      </section>

      <section className="aa-card-free mt-8">
        <h2 className="text-lg font-semibold">Businesses</h2>
        {businesses.length === 0 ? (
          <p className="aa-muted mt-3 text-sm">No businesses yet.</p>
        ) : (
          <table className="aa-table mt-4">
            <thead>
              <tr>
                <th>Legal name</th>
                <th>ABN</th>
                <th>GST basis</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id}>
                  <td>{b.tradingName || b.legalName}</td>
                  <td>{b.abn || "—"}</td>
                  <td>{b.gstBasis}</td>
                  <td className="space-x-3">
                    <Link
                      className="font-semibold text-accent"
                      href={`/accounting?businessId=${b.id}`}
                    >
                      Ledger
                    </Link>
                    <Link
                      className="font-semibold text-accent"
                      href={`/reports?businessId=${b.id}`}
                    >
                      Reports
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <CreateBusinessForm practiceId={practice.practiceId} />
    </main>
  );
}
