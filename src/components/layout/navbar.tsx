"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Search, Menu, User, LogOut, Settings, LayoutDashboard, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationBell } from "./notification-bell";

const HOVER_THRESHOLD = 80;

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session } = useSession();
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < HOVER_THRESHOLD) {
        clearTimeout(hideTimer.current);
        setVisible(true);
      } else if (e.clientY > 104) {
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => {
          setVisible(false);
          setMenuOpen(false);
        }, 800);
      }
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(hideTimer.current);
    };
  }, []);

  const handleEnter = useCallback(() => {
    clearTimeout(hideTimer.current);
    setVisible(true);
  }, []);
  const handleLeave = useCallback(() => {
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setMenuOpen(false);
    }, 600);
  }, []);

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-30 pointer-events-none"
        style={{ height: HOVER_THRESHOLD + "px" }}
      />

      <motion.header
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        animate={{ y: visible ? 0 : -80 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
        <motion.div
          animate={{ opacity: visible ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="glass-heavy border-b border-border/50"
        >
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-8">
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:neon-glow transition-all duration-300">
                  <span className="text-primary font-bold text-sm font-mono">N</span>
                </div>
                <span className="font-heading font-bold text-lg tracking-tight">
                  <span className="text-primary">Nex</span>
                  <span className="text-foreground">us</span>
                </span>
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                <NavLink href="/resources">资源</NavLink>
                <NavLink href="/forum">论坛</NavLink>
                <NavLink href="/dashboard">仪表盘</NavLink>
              </nav>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { window.dispatchEvent(new CustomEvent("open-search-overlay")); }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all text-sm cursor-text"
              >
                <Search className="w-4 h-4" />
                <span className="text-xs">搜索资源、帖子...</span>
                <kbd className="ml-4 text-[10px] font-mono bg-surface-hover px-1.5 py-0.5 rounded border border-border">
                  Ctrl+K
                </kbd>
              </button>

              <NotificationBell />

              {session?.user ? (
                /* Logged in — user menu */
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-surface-hover transition-all duration-200"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center overflow-hidden">
                      {session.user.image ? (
                        <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-mono text-primary font-bold">
                          {(session.user.name || session.user.email || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="hidden sm:block text-xs text-muted-foreground font-mono">
                      {session.user.name || session.user.email?.split("@")[0]}
                    </span>
                  </button>

                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-surface border border-border/40 shadow-xl overflow-hidden"
                      >
                        <div className="p-1.5">
                          <Link
                            href="/dashboard"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            仪表盘
                          </Link>
                          <Link
                            href="/settings"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all"
                          >
                            <Settings className="w-4 h-4" />
                            设置
                          </Link>
                          {(session.user as any)?.role === "ADMIN" && (
                            <Link
                              href="/admin"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-amber-400 hover:text-amber-300 hover:bg-surface-hover transition-all"
                            >
                              <Shield className="w-4 h-4" />
                              后台管理
                            </Link>
                          )}
                          <button
                            onClick={() => { setMenuOpen(false); signOut(); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-accent hover:bg-accent/10 transition-all"
                          >
                            <LogOut className="w-4 h-4" />
                            退出登录
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Not logged in */
                <Link
                  href="/auth"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 hover:neon-glow transition-all duration-300 text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">登录</span>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </motion.header>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      prefetch
      className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-hover transition-all duration-200"
    >
      {children}
    </Link>
  );
}
