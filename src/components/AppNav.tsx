import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/accounting", label: "Accounting" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function AppNav({ practiceName }: { practiceName?: string }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="aa-brand text-3xl text-ink md:text-4xl">Agentic Accounting</p>
        <p className="aa-muted mt-1 text-sm">
          {practiceName ? practiceName : "Australian ledger platform"}
        </p>
      </div>
      <nav className="flex flex-wrap gap-3 text-sm font-semibold">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border-b border-transparent pb-0.5 hover:border-accent"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
