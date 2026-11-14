"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatAudFromCents } from "@/lib/format";

type AccountOption = { id: string; code: string; name: string };

export function ManualJournalForm({
  businessId,
  accounts,
}: {
  businessId: string;
  accounts: AccountOption[];
}) {
  const router = useRouter();
  const expenseDefault =
    accounts.find((a) => a.code === "6200")?.id ?? accounts[0]?.id ?? "";
  const bankDefault =
    accounts.find((a) => a.code === "1000")?.id ?? accounts[1]?.id ?? "";

  const [date, setDate] = useState("2025-08-15");
  const [narration, setNarration] = useState("Office expenses");
  const [debitAccountId, setDebitAccountId] = useState(expenseDefault);
  const [creditAccountId, setCreditAccountId] = useState(bankDefault);
  const [amountCents, setAmountCents] = useState("11000");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function createAndPost(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const amount = Number(amountCents);
    const create = await fetch(`/api/v1/businesses/${businessId}/journals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date,
        narration,
        lines: [
          {
            accountId: debitAccountId,
            description: narration,
            debitCents: amount,
            creditCents: 0,
          },
          {
            accountId: creditAccountId,
            description: narration,
            debitCents: 0,
            creditCents: amount,
          },
        ],
      }),
    });
    const created = await create.json();
    if (!create.ok) {
      setError(created?.error?.message ?? "Could not create journal");
      return;
    }
    const post = await fetch(
      `/api/v1/businesses/${businessId}/journals/${created.journal.id}/post`,
      { method: "POST" },
    );
    const posted = await post.json();
    if (!post.ok) {
      setError(posted?.error?.message ?? "Could not post journal");
      router.refresh();
      return;
    }
    setMessage(`Posted journal #${posted.journal.journalNumber}`);
    router.refresh();
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Post manual journal</h2>
      <form onSubmit={createAndPost} className="mt-4 space-y-3">
        <label className="block text-sm">
          Date
          <input
            className="aa-input mt-1"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Narration
          <input
            className="aa-input mt-1"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Debit account
          <select
            className="aa-select mt-1"
            value={debitAccountId}
            onChange={(e) => setDebitAccountId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Credit account
          <select
            className="aa-select mt-1"
            value={creditAccountId}
            onChange={(e) => setCreditAccountId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Amount (cents)
          <input
            className="aa-input mt-1"
            value={amountCents}
            onChange={(e) => setAmountCents(e.target.value)}
            required
          />
        </label>
        <p className="aa-muted text-xs">
          Preview: {formatAudFromCents(amountCents || "0")}
        </p>
        <button className="aa-btn aa-btn-primary" type="submit">
          Create &amp; post
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-ok">{message}</p> : null}
    </div>
  );
}
