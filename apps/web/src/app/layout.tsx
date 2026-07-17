import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { PwaInstall } from "@/components/pwa-install";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ??
  (process.env.NODE_ENV === "production" ? "/app/smartrent" : "");

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartRent",
  description: "Tenant management and rent billing.",
  applicationName: "SmartRent",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SmartRent",
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable}`}>
        {children}
        <PwaInstall basePath={basePath} />
      </body>
    </html>
  );
}
