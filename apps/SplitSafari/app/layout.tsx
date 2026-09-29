import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SplitSafari",
  description: "Shared expenses, sorted. No signup needed.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/app/SplitSafari/favicon.svg",
    shortcut: "/app/SplitSafari/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

