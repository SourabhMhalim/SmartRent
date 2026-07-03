import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function DashboardBackLink() {
  return (
    <Link
      className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-bold text-[#475569] hover:bg-[#F8FAFC]"
      href="/dashboard"
    >
      <ArrowLeft size={17} />
      Back to dashboard
    </Link>
  );
}
