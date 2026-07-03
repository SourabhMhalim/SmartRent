"use client";

import { Brand } from "@/components/brand";
import { AuthSession, clearSession } from "@/lib/api";
import {
  Bell,
  Building2,
  ChevronDown,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRound,
  UsersRound,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Properties", icon: Building2, href: "/dashboard/properties" },
  { label: "Tenants", icon: UsersRound, href: "/dashboard/tenants" },
  { label: "Invoices", icon: FileText, href: "/dashboard/invoices" },
  { label: "Payments", icon: WalletCards, href: "/dashboard/payments" },
  { label: "Maintenance", icon: Wrench, href: "#" },
];

const notifications = [
  {
    title: "Rent due in 3 days",
    detail: "Aarav Mehta · Unit 204",
    time: "12 min",
    color: "#e9b949",
  },
  {
    title: "Payment marked received",
    detail: "₹18,500 from Neha Shah",
    time: "2 hr",
    color: "#14B8A6",
  },
  {
    title: "New maintenance request",
    detail: "Water leakage · Unit 101",
    time: "Yesterday",
    color: "#e86d53",
  },
];

export function DashboardShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: AuthSession;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const fullName = session.user.user_metadata?.full_name ?? "Landlord";
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="app-shell">
      {sidebarOpen ? (
        <button
          aria-label="Close navigation"
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5">
            <Brand dark />
            <button
              aria-label="Close navigation"
              className="mobile-nav-button size-9 place-items-center rounded-md text-white/75 hover:bg-white/10"
              onClick={() => setSidebarOpen(false)}
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-3 py-6">
            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
              Workspace
            </p>
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.label}>
                  {(() => {
                    const active =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : item.href !== "#" && pathname.startsWith(item.href);
                    return (
                  <Link
                    className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                      active
                        ? "bg-white text-[#0F766E]"
                        : "text-white/72 hover:bg-white/10 hover:text-white"
                    }`}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon size={19} strokeWidth={2} />
                    {item.label}
                  </Link>
                    );
                  })()}
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-white/10 p-3">
            <Link
              className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white"
              href="#"
            >
              <CircleHelp size={19} />
              Help center
            </Link>
          </div>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
              className="mobile-nav-button size-10 shrink-0 place-items-center rounded-md text-[#475569] hover:bg-[#F1F5F9]"
              onClick={() => setSidebarOpen(true)}
              title="Open navigation"
              type="button"
            >
              <Menu size={21} />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#64748B]">
                {pathname.startsWith("/dashboard/properties")
                  ? "Portfolio"
                  : pathname.startsWith("/dashboard/tenants")
                    ? "Occupancy"
                    : pathname.startsWith("/dashboard/invoices")
                      ? "Billing"
                    : pathname.startsWith("/dashboard/payments")
                      ? "Collections"
                    : pathname.startsWith("/dashboard/profile")
                      ? "Account"
                    : "Overview"}
              </p>
              <h1 className="font-display truncate text-lg font-extrabold tracking-normal">
                {pathname.startsWith("/dashboard/properties")
                  ? "Property management"
                  : pathname.startsWith("/dashboard/tenants")
                    ? "Tenant management"
                    : pathname.startsWith("/dashboard/invoices")
                      ? "Invoice management"
                    : pathname.startsWith("/dashboard/payments")
                      ? "Payment management"
                    : pathname.startsWith("/dashboard/profile")
                      ? "Landlord profile"
                    : "Landlord dashboard"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                aria-expanded={notificationsOpen}
                aria-label="Notifications"
                className="relative grid size-10 place-items-center rounded-md text-[#475569] hover:bg-[#F1F5F9]"
                onClick={() => {
                  setNotificationsOpen((value) => !value);
                  setProfileOpen(false);
                }}
                title="Notifications"
                type="button"
              >
                <Bell size={20} />
                <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-[#e86d53]" />
              </button>

              {notificationsOpen ? (
                <div className="popover notification-panel overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                    <div>
                      <p className="font-display font-extrabold">Notifications</p>
                      <p className="mt-0.5 text-xs text-[#64748B]">3 unread updates</p>
                    </div>
                    <button
                      className="text-xs font-bold text-[#0F766E] hover:underline"
                      type="button"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div>
                    {notifications.map((item) => (
                      <button
                        className="flex w-full gap-3 border-b border-[#E2E8F0] px-4 py-4 text-left hover:bg-[#F8FAFC]"
                        key={item.title}
                        type="button"
                      >
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold">{item.title}</span>
                          <span className="mt-1 block truncate text-xs text-[#64748B]">
                            {item.detail}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-[#94A3B8]">
                          {item.time}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    className="w-full px-4 py-3 text-sm font-bold text-[#0F766E] hover:bg-[#F8FAFC]"
                    type="button"
                  >
                    View all notifications
                  </button>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                aria-expanded={profileOpen}
                className="flex h-11 items-center gap-3 rounded-md px-2 hover:bg-[#F1F5F9]"
                onClick={() => {
                  setProfileOpen((value) => !value);
                  setNotificationsOpen(false);
                }}
                type="button"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#CCFBF1] text-sm font-extrabold text-[#0F766E]">
                  {initials || "L"}
                </span>
                <span className="mobile-hide text-left">
                  <span className="block text-sm font-bold">{fullName}</span>
                  <span className="block text-xs text-[#64748B]">Landlord</span>
                </span>
                <ChevronDown className="mobile-hide text-[#64748B]" size={16} />
              </button>

              {profileOpen ? (
                <div className="popover overflow-hidden">
                  <div className="border-b border-[#E2E8F0] px-4 py-4">
                    <p className="text-sm font-bold">{fullName}</p>
                    <p className="mt-1 truncate text-xs text-[#64748B]">
                      {session.user.email ?? session.user.phone ?? "Landlord account"}
                    </p>
                  </div>
                  <div className="p-2">
                    <Link
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-[#F1F5F9]"
                      href="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                    >
                      <UserRound size={17} />
                      Profile
                    </Link>
                    <Link
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-[#F1F5F9]"
                      href="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings size={17} />
                      Settings
                    </Link>
                    <button
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-[#b34e3b] hover:bg-[#fff4f1]"
                      onClick={signOut}
                      type="button"
                    >
                      <LogOut size={17} />
                      Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
