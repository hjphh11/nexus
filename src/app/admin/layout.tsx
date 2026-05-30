"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Users, Database, MessageSquare, Settings, ArrowLeft, Shield, Bell } from "lucide-react";

const menuItems = [
  { href: "/admin", label: "总览", icon: LayoutDashboard },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/resources", label: "资源管理", icon: Database },
  { href: "/admin/forum", label: "论坛管理", icon: MessageSquare },
  { href: "/admin/settings", label: "站点设置", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (session && (session.user as any)?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-14 shrink-0 bg-surface border-b border-border/30 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> 返回前台
          </Link>
          <span className="text-sm font-heading font-semibold text-foreground">后台管理</span>
        </div>
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">{session.user?.name || session.user?.email}</span>
        </div>
      </header>

      <div className="flex flex-1">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-surface border-r border-border/30 flex flex-col">
        <nav className="flex-1 p-3 flex flex-col gap-0.5">
          {menuItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-primary" />
            管理员模式
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 bg-background">{children}</main>
      </div>
    </div>
  );
}
