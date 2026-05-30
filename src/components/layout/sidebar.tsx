"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  X,
  LayoutDashboard,
  Database,
  MessageSquare,
  Upload,
  Settings,
  Search,
  Home,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sections = [
  {
    label: "主导航",
    items: [
      { href: "/", label: "首页", icon: Home },
      { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
    ],
  },
  {
    label: "核心功能",
    items: [
      { href: "/resources", label: "资源广场", icon: Database },
      { href: "/forum", label: "技术论坛", icon: MessageSquare },
      { href: "/upload", label: "上传资源", icon: Upload },
    ],
  },
  {
    label: "系统",
    items: [
      { href: "#search", label: "全局搜索", icon: Search, isSearch: true },
      { href: "/settings", label: "系统设置", icon: Settings },
    ],
  },
];

const COLLAPSED_W = 60;
const EXPANDED_W = 244;
const HOVER_THRESHOLD = 280;

const springTransition = { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

export function Sidebar({
  open: mobileOpen,
  onClose: onMobileClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState(false);
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX < HOVER_THRESHOLD) {
        clearTimeout(hideTimer.current);
        setExpanded(true);
      } else if (e.clientX > EXPANDED_W + 60) {
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setExpanded(false), 500);
      }
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(hideTimer.current);
    };
  }, []);

  const handleSidebarEnter = useCallback(() => {
    clearTimeout(hideTimer.current);
    setExpanded(true);
  }, []);
  const handleSidebarLeave = useCallback(() => {
    hideTimer.current = setTimeout(() => setExpanded(false), 400);
  }, []);

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <div
        className="hidden lg:block fixed left-0 top-16 z-30"
        style={{ width: HOVER_THRESHOLD + "px", height: "calc(100vh - 4rem)" }}
      />

      <motion.aside
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        animate={{ width: expanded ? EXPANDED_W : COLLAPSED_W }}
        transition={springTransition}
        className={cn(
          "fixed top-16 z-40 h-[calc(100vh-4rem)]",
          "glass-heavy border-r border-border/50",
          "lg:translate-x-0 overflow-hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Right edge glow */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute right-0 top-8 bottom-8 w-px"
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(0,240,255,0.4) 30%, rgba(124,58,237,0.3) 70%, transparent 100%)",
              }}
            />
          )}
        </AnimatePresence>

        <div className="p-3 flex flex-col h-full overflow-hidden">
          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="lg:hidden self-end p-1.5 mb-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-hover"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Admin link */}
          {isAdmin && (
            <Link href="/admin" onClick={onMobileClose} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 relative overflow-hidden mb-3",
              pathname?.startsWith("/admin") ? "bg-primary/10 text-primary border border-primary/20 neon-border" : "text-amber-400 hover:text-amber-300 hover:bg-surface-hover"
            )}>
              <Shield className="w-4 h-4 shrink-0" />
              <span className={cn("text-sm truncate transition-opacity duration-200", expanded ? "opacity-100" : "opacity-0")}>后台管理</span>
            </Link>
          )}

          {/* Navigation */}
          <nav className="flex-1 flex flex-col gap-5 overflow-y-auto overflow-x-hidden pb-4">
            {sections.map((section) => (
              <div key={section.label}>
                {/* Section header — fades, doesn't shift layout */}
                <div className="px-2 mb-1.5 h-4">
                  <AnimatePresence>
                    {expanded && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[10px] font-mono text-muted-foreground/50 tracking-widest uppercase whitespace-nowrap"
                      >
                        {section.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Nav items — icons stay fixed, text fades */}
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if ((item as any).isSearch) {
                      return (
                        <button
                          key={item.href}
                          onClick={() => { onMobileClose(); window.dispatchEvent(new CustomEvent("open-search-overlay")); }}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 relative overflow-hidden w-full text-left",
                            "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                          )}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className={cn("text-sm truncate transition-opacity duration-200", expanded ? "opacity-100" : "opacity-0")}>
                            {item.label}
                          </span>
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch
                        onClick={onMobileClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 relative overflow-hidden",
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/20 neon-border"
                            : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                        )}
                      >
                        {/* Icon — absolutely positioned, never moves */}
                        <Icon className="w-4 h-4 shrink-0" />

                        {/* Text — fades in place to the right of icon, no layout shift */}
                        <span
                          className={cn(
                            "text-sm truncate transition-opacity duration-200",
                            expanded ? "opacity-100" : "opacity-0"
                          )}
                        >
                          {item.label}
                        </span>

                        {/* Active dot when collapsed */}
                        {!expanded && isActive && (
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom status */}
          <div className="mt-auto pt-3 border-t border-border/30">
            <div className="rounded-lg bg-surface border border-border/50 p-2.5 space-y-1.5">
              <div
                className={cn(
                  "flex items-center justify-between text-[11px] transition-opacity duration-200",
                  expanded ? "opacity-100" : "opacity-0"
                )}
              >
                <span className="text-muted-foreground">系统状态</span>
                <span className="flex items-center gap-1 text-success">
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-success"
                  />
                  运行中
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center justify-between text-[11px] transition-opacity duration-200",
                  expanded ? "opacity-100" : "opacity-0"
                )}
              >
                <span className="text-muted-foreground">延迟 / 节点</span>
                <span className="font-mono text-foreground">24ms / 2,847</span>
              </div>
              {/* Collapsed pulse dot — centered below the border */}
              <AnimatePresence>
                {!expanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center"
                  >
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-2 h-2 rounded-full bg-success"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
