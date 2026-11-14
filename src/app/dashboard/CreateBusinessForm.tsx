"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateBusinessForm({ practiceId }: { practiceId: string }) {
  const router = useRouter();
  const [legalName, setLegalName] = useState("");
  const [abn, setAbn] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function createBusiness(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const res = await fetch(`/api/v1/practices/${practiceId}/businesses`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ legalName, abn: abn || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message ?? "Could not create business");
      return;
    }
    setLegalName("");
    setAbn("");
    router.refresh();
  }

  return (
    <section className="aa-card-free mt-10">
      <h2 className="text-lg font-semibold">Add business</h2>
      <form onSubmit={createBusiness} className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          Legal name
          <input
            className="aa-input mt-1"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          ABN
          <input
            className="aa-input mt-1"
            value={abn}
            onChange={(e) => setAbn(e.target.value)}
            placeholder="11 111 111 111"
          />
        </label>
        <div className="md:col-span-2">
          <button className="aa-btn aa-btn-primary" type="submit">
            Create business
          </button>
        </div>
      </form>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </section>
  );
}
