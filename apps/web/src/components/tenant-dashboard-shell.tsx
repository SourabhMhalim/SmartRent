"use client";

import { Brand } from "@/components/brand";
import { AuthSession, clearSession } from "@/lib/api";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from "@/lib/notifications-api";
import { Bell, FileText, Home, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { label: "Home", icon: Home, href: "/tenant-dashboard" },
  { label: "Invoices", icon: FileText, href: "/tenant-dashboard/invoices" },
];

export function TenantDashboardShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: AuthSession;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const fullName = session.user.user_metadata?.full_name ?? "Tenant";
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  async function loadNotifications() {
    try {
      const summary = await listNotifications();
      setNotifications(summary.notifications);
      setUnreadCount(summary.unreadCount);
      setNotificationError("");
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : "Unable to load notifications.",
      );
    }
  }

  async function handleNotificationClick(notification: NotificationItem) {
    if (!notification.readAt) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((items) =>
          items.map((item) =>
            item.id === notification.id
              ? { ...item, readAt: new Date().toISOString() }
              : item,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (error) {
        setNotificationError(
          error instanceof Error ? error.message : "Unable to update notification.",
        );
        return;
      }
    }
    if (notification.actionHref) {
      setNotificationsOpen(false);
      router.push(notification.actionHref);
    }
  }

  async function handleMarkAllRead() {
    try {
      const summary = await markAllNotificationsRead();
      setNotifications(summary.notifications);
      setUnreadCount(summary.unreadCount);
      setNotificationError("");
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : "Unable to update notifications.",
      );
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Brand href="/tenant-dashboard" />
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                aria-expanded={notificationsOpen}
                aria-label="Notifications"
                className="relative grid size-9 place-items-center rounded-md text-[#64748B] hover:bg-[#F1F5F9]"
                onClick={() => {
                  setNotificationsOpen((value) => !value);
                  loadNotifications();
                }}
                title="Notifications"
                type="button"
              >
                <Bell size={18} />
                {unreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-white bg-[#e86d53]" />
                ) : null}
              </button>

              {notificationsOpen ? (
                <div className="popover notification-panel overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                    <div>
                      <p className="font-display font-extrabold">Notifications</p>
                      <p className="mt-0.5 text-xs text-[#64748B]">
                        {unreadCount === 1
                          ? "1 unread update"
                          : `${unreadCount} unread updates`}
                      </p>
                    </div>
                    <button
                      className="text-xs font-bold text-[#0F766E] hover:underline disabled:text-[#94A3B8] disabled:no-underline"
                      disabled={unreadCount === 0}
                      onClick={handleMarkAllRead}
                      type="button"
                    >
                      Mark all read
                    </button>
                  </div>
                  {notificationError ? (
                    <p className="border-b border-[#E2E8F0] px-4 py-3 text-xs font-semibold text-[#b34e3b]">
                      {notificationError}
                    </p>
                  ) : null}
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm font-semibold text-[#64748B]">
                        No notifications yet.
                      </p>
                    ) : null}
                    {notifications.map((item) => (
                      <button
                        className="flex w-full gap-3 border-b border-[#E2E8F0] px-4 py-4 text-left hover:bg-[#F8FAFC]"
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        type="button"
                      >
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: item.readAt
                              ? "#CBD5E1"
                              : notificationColor(item.notificationType),
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold">{item.title}</span>
                          <span className="mt-1 block truncate text-xs text-[#64748B]">
                            {item.message}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-[#94A3B8]">
                          {formatNotificationTime(item.createdAt)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{fullName}</p>
              <p className="text-xs text-[#64748B]">Tenant</p>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-[#DBEAFE] text-sm font-extrabold text-[#1D4ED8]">
              <UserRound size={18} />
            </span>
            <button
              aria-label="Sign out"
              className="grid size-9 place-items-center rounded-md text-[#64748B] hover:bg-[#F1F5F9]"
              onClick={signOut}
              title="Sign out"
              type="button"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="min-w-0 flex gap-2 overflow-x-auto md:block md:space-y-2 md:overflow-visible">
          {navigation.map((item) => {
            const active =
              item.href === "/tenant-dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                className={`flex h-11 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-semibold ${
                  active
                    ? "bg-[#0F766E] text-white"
                    : "bg-white text-[#475569] hover:bg-[#F1F5F9]"
                }`}
                href={item.href}
                key={item.href}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function notificationColor(type: NotificationItem["notificationType"]) {
  if (type === "PAYMENT_VERIFIED") {
    return "#14B8A6";
  }
  if (type === "PAYMENT_REJECTED" || type === "INVOICE_OVERDUE") {
    return "#e86d53";
  }
  if (type === "RENT_DUE_SOON") {
    return "#e9b949";
  }
  return "#0F766E";
}

function formatNotificationTime(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const elapsedMs = Date.now() - created;
  const minutes = Math.max(0, Math.floor(elapsedMs / 60000));
  if (minutes < 1) {
    return "Now";
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days`;
}
