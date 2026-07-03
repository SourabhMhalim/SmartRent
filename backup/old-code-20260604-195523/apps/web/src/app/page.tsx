import Link from "next/link";
import { Building2, ReceiptText, Wrench } from "lucide-react";

const stats = [
  { label: "Properties", value: "0", icon: Building2 },
  { label: "Invoices Due", value: "0", icon: ReceiptText },
  { label: "Open Tickets", value: "0", icon: Wrench }
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm text-muted-foreground">SmartRent MVP</p>
            <h1 className="text-2xl font-semibold">Rental operations dashboard</h1>
          </div>
          <Link
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            href="/login"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-8 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-4 text-3xl font-semibold">{stat.value}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}

