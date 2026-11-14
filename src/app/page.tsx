import Link from "next/link";

export default function HomePage() {
  return (
    <main className="aa-shell">
      <section className="grid min-h-[80vh] items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="aa-brand text-5xl leading-tight text-ink md:text-6xl">
            Agentic Accounting
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-soft">
            A production-grade Australian double-entry ledger for practices and
            their clients — built to replace Xero for supported workflows, with
            AI that proposes and humans that approve.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="aa-btn aa-btn-primary">
              Start a practice
            </Link>
            <Link href="/login" className="aa-btn aa-btn-ghost">
              Sign in
            </Link>
          </div>
        </div>
        <div
          className="min-h-[280px] rounded-sm border border-line bg-[linear-gradient(145deg,#0f6b57_0%,#14352c_55%,#1b2a44_100%)] p-6 text-white shadow-none"
          aria-hidden
        >
          <p className="text-sm uppercase tracking-[0.18em] text-white/70">
            Phase 1 live
          </p>
          <p className="aa-brand mt-6 text-3xl">Balanced journals. Exact cents.</p>
          <p className="mt-4 max-w-sm text-white/80">
            Multi-tenant practices, chart of accounts, GST tax codes, period
            locks, posting controls, trial balance, and audit trail.
          </p>
        </div>
      </section>
    </main>
  );
}
