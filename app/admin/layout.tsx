"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import AdminNavbar from "../components/admin/AdminNavbar";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminMobileDock from "../components/admin/AdminMobileDock";
import AdminAuthGate from "../components/admin/AdminAuthGate";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname?.startsWith("/admin/login") ||
    pathname?.startsWith("/admin/signup");

  if (isAuthPage) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <AdminAuthGate>
      <div className="flex min-h-screen w-full overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminNavbar />
          <section className="flex-1 overflow-y-auto p-8 pb-24 md:pb-8">
            {children}
          </section>
        </div>
      </div>
      <AdminMobileDock />
    </AdminAuthGate>
  );
}
