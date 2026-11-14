"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        email: form.get("email"),
        password: form.get("password"),
        practiceName: form.get("practiceName"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data?.error?.message ?? "Registration failed");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="aa-shell max-w-lg">
      <p className="aa-brand text-4xl">Agentic Accounting</p>
      <h1 className="mt-6 text-2xl font-semibold">Create your practice</h1>
      <p className="aa-muted mt-2 text-sm">
        Registers you as practice owner and opens the ledger workspace.
      </p>
      <form onSubmit={onSubmit} className="aa-card-free mt-8 space-y-4">
        <label className="block text-sm">
          Full name
          <input className="aa-input mt-1" name="fullName" required />
        </label>
        <label className="block text-sm">
          Practice name
          <input className="aa-input mt-1" name="practiceName" required />
        </label>
        <label className="block text-sm">
          Email
          <input className="aa-input mt-1" type="email" name="email" required />
        </label>
        <label className="block text-sm">
          Password (min 10 characters)
          <input
            className="aa-input mt-1"
            type="password"
            name="password"
            minLength={10}
            required
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button className="aa-btn aa-btn-primary" disabled={loading} type="submit">
          {loading ? "Creating…" : "Create practice"}
        </button>
      </form>
      <p className="mt-6 text-sm">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
