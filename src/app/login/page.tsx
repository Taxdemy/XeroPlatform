"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data?.error?.message ?? "Login failed");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="aa-shell max-w-lg">
      <p className="aa-brand text-4xl">Agentic Accounting</p>
      <h1 className="mt-6 text-2xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="aa-card-free mt-8 space-y-4">
        <label className="block text-sm">
          Email
          <input className="aa-input mt-1" type="email" name="email" required />
        </label>
        <label className="block text-sm">
          Password
          <input className="aa-input mt-1" type="password" name="password" required />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button className="aa-btn aa-btn-primary" disabled={loading} type="submit">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-sm">
        New practice? <Link href="/register">Register</Link>
      </p>
    </main>
  );
}
