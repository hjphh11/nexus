"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/actions/notifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [list, setList] = useState<Awaited<ReturnType<typeof getNotifications>>>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    const [n, count] = await Promise.all([getNotifications(), getUnreadCount()]);
    setList(n);
    setUnread(count);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  // Refresh every 30s
  useEffect(() => {
    const i = setInterval(fetch, 30000);
    return () => clearInterval(i);
  }, [fetch]);

  async function handleClick(id: string) {
    await markAsRead(id);
    fetch();
  }

  async function handleMarkAll() {
    setLoading(true);
    await markAllAsRead();
    await fetch();
    setLoading(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-accent flex items-center justify-center text-[9px] font-bold text-white px-1">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-surface border border-border/40 shadow-xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-3 border-b border-border/20">
              <span className="text-xs font-heading font-semibold text-foreground">通知</span>
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  disabled={loading}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                >
                  <Check className="w-3 h-3" /> 全部已读
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {list.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-primary/10 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">暂无通知</p>
                </div>
              ) : (
                list.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link || "#"}
                    onClick={() => { handleClick(n.id); setOpen(false); }}
                    className={`flex items-start gap-3 p-3 border-b border-border/10 hover:bg-surface-hover transition-colors ${
                      !n.isRead ? "bg-primary/[0.02]" : ""
                    }`}
                  >
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                    <div className={`flex-1 min-w-0 ${n.isRead ? "ml-5" : ""}`}>
                      <p className="text-xs text-foreground leading-relaxed">{n.title}</p>
                      {n.body && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(n.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
