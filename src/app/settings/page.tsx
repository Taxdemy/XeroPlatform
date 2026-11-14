import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { getDb } from "@/server/db/client";
import { getUserBySession } from "@/server/auth/service";
import { readSessionToken } from "@/server/http/session";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const db = await getDb();
  const user = await getUserBySession(db, await readSessionToken());
  if (!user) redirect("/login");

  return (
    <main className="aa-shell">
      <AppNav />
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="aa-card-free mt-6 space-y-2 text-sm">
        <p>
          <span className="aa-muted">Signed in as</span> {user.fullName} (
          {user.email})
        </p>
        <p className="aa-muted">
          MFA, AI model routing, and integration credentials arrive in later
          phases. Secrets are never stored in frontend code.
        </p>
        <LogoutButton />
      </section>
    </main>
  );
}
