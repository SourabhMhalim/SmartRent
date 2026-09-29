import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Applications | Sourabh Mhalim",
  description: "Explore hosted applications by Sourabh Mhalim. Manage rentals with SmartRent or split shared expenses with SplitSafari.",
};

const applications = [
  {
    name: "SmartRent",
    category: "Property management",
    description: "Manage your properties, tenants, and rent in one place. Simplify monthly billing, generate invoices, and keep track of payments.",
    features: ["Tenant management", "Rent billing", "Payment tracking"],
    href: "/app/smartrent",
  },
  {
    name: "SplitSafari",
    category: "Shared expenses",
    description: "Keep trips and shared expenses simple. Add your people, choose who shares each expense, and see exactly who owes whom. No signup needed.",
    features: ["Personal invite links", "Flexible expense splits", "Clear balances"],
    href: "/app/SplitSafari",
  },
];

export default function ApplicationsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className="brand" href="/app/portfolio" aria-label="Sourabh Mhalim - home">
          <span className="brand-mark">SM</span>
          <span>Sourabh Mhalim</span>
        </Link>
        <Link className={styles.backLink} href="/app/portfolio">Back to portfolio <span aria-hidden="true">↗</span></Link>
      </header>

      <section className={styles.content} aria-labelledby="apps-title">
        <div className={styles.intro}>
          <p className="eyebrow"><span /> Built for everyday work</p>
          <h1 id="apps-title">Applications</h1>
          <p>Useful tools, all in one place. Choose an application to get started.</p>
        </div>
        <div className={styles.listHeading}>
          <h2>Hosted applications</h2>
          <span>{applications.length} available</span>
        </div>
        <ul className={styles.grid}>
          {applications.map((app) => (
            <li key={app.href}>
              <article className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.icon} aria-hidden="true">
                    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                      {app.name === "SplitSafari" ? <><circle cx="16" cy="16" r="12" /><path d="m22 10-4 8-8 4 4-8Z" /></> : <><path d="m5 14 11-9 11 9v13H5V14Z" /><path d="M12 27V17h8v10M12 12h8" /></>}
                    </svg>
                  </span>
                  <span className={styles.badge}>Available</span>
                </div>
                <p className={styles.category}>{app.category}</p>
                <h3>{app.name}</h3>
                <p className={styles.description}>{app.description}</p>
                <ul className={styles.features}>
                  {app.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <a className={`button button-primary ${styles.launch}`} href={app.href}>
                  Launch {app.name}
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </a>
              </article>
            </li>
          ))}
        </ul>
      </section>
      <div className={styles.footnote}>Built by Sourabh Mhalim · Tools that make everyday work simpler.</div>
    </main>
  );
}
