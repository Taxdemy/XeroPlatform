"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="aa-btn aa-btn-ghost mt-4"
      type="button"
      onClick={async () => {
        await fetch("/api/v1/auth/logout", { method: "POST" });
        router.replace("/login");
      }}
    >
      Sign out
    </button>
  );
}
