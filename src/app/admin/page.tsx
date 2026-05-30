"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Database, MessageSquare, FileText, Eye, TrendingUp, Activity, Clock, UserPlus, Download, HardDrive } from "lucide-react";
import { getAdminStats } from "@/actions/admin";
import gsap from "gsap";

const statCards = [
  { key: "users", label: "注册用户", icon: Users, color: "#00f0ff" },
  { key: "resources", label: "资源总数", icon: Database, color: "#7c3aed" },
  { key: "posts", label: "帖子总数", icon: MessageSquare, color: "#f43f5e" },
  { key: "comments", label: "评论总数", icon: FileText, color: "#10b981" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function AdminOverview() {
  type Stats = Awaited<ReturnType<typeof getAdminStats>>;
  const [data, setData] = useState<Stats | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const extraRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => { getAdminStats().then(setData); }, []);

  // GSAP entrance animation
  useEffect(() => {
    if (!data) return;
    const ctx = gsap.context(() => {
      // Main stat cards — staggered entrance
      gsap.fromTo(cardsRef.current.filter(Boolean),
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" }
      );
      // Extra cards
      gsap.fromTo(extraRef.current.filter(Boolean),
        { opacity: 0, y: 20, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: "power2.out", delay: 0.3 }
      );
      // Table
      gsap.fromTo(".admin-table-row",
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.04, ease: "power2.out", delay: 0.5 }
      );
    });
    return () => ctx.revert();
  }, [data]);

  if (!data) {
    return (
      <div className="p-8 space-y-6">
        {[1,2,3,4].map((i) => (<div key={i} className="rounded-xl bg-surface border border-border/30 p-6 h-28 shimmer-bg" />))}
      </div>
    );
  }

  const mainValues = [data.stats.users, data.stats.resources, data.stats.posts, data.stats.comments];

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">总览</h1>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-glow-pulse" />
            系统运行中 · 最后更新 {new Date().toLocaleTimeString("zh-CN")}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><UserPlus className="w-3.5 h-3.5 text-primary" /> 今日注册 +{data.today.users}</span>
          <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-success" /> 今日资源 +{data.today.resources}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-chart-4" /> 今日帖子 +{data.today.posts}</span>
        </div>
      </div>

      {/* Main stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => (
          <div
            key={card.key}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="group relative rounded-xl bg-surface border border-border/30 p-5 overflow-hidden hover:border-primary/20 transition-colors duration-300"
          >
            {/* Background glow */}
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle, ${card.color}, transparent)` }} />
            {/* Top line */}
            <div className="absolute top-0 left-3 right-3 h-px opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${card.color}10`, border: `1px solid ${card.color}30` }}>
                  <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <span className="w-1.5 h-1.5 rounded-full animate-glow-pulse" style={{ backgroundColor: card.color }} />
              </div>
              <div className="text-2xl font-bold font-mono text-foreground tabular-nums">{mainValues[i].toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Extra cards — real data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { key: "visitors", label: "全站浏览量", icon: Eye, color: "#f59e0b", value: data.totalViews.toLocaleString() },
          { key: "downloads", label: "总下载量", icon: Download, color: "#7c3aed", value: data.totalDownloads.toLocaleString() },
          { key: "storage", label: "存储占用", icon: HardDrive, color: "#10b981", value: formatBytes(data.totalStorage) },
          { key: "todayUsers", label: "今日新增用户", icon: UserPlus, color: "#00f0ff", value: data.today.users.toLocaleString() },
        ].map((card, i) => (
          <div
            key={card.key}
            ref={(el) => { extraRef.current[i] = el; }}
            className="relative rounded-xl bg-surface/60 border border-border/20 p-4 hover:bg-surface hover:border-border/40 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${card.color}0d`, border: `1px solid ${card.color}25` }}>
                <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-foreground">{card.value}</div>
                <div className="text-[11px] text-muted-foreground">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent users table */}
      <div className="rounded-xl bg-surface border border-border/30 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/20 flex items-center justify-between">
          <h2 className="text-sm font-heading font-semibold text-foreground">最近注册用户</h2>
          <span className="text-[10px] text-muted-foreground">{data.recentUsers.length} 条</span>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-border/10">
            <tr className="text-left text-muted-foreground text-xs">
              <th className="p-3 pl-5 font-medium">用户</th>
              <th className="p-3 font-medium">邮箱</th>
              <th className="p-3 font-medium">角色</th>
              <th className="p-3 font-medium">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {data.recentUsers.map((u) => (
              <tr key={u.id} className="admin-table-row border-b border-border/5 hover:bg-surface-hover transition-colors">
                <td className="p-3 pl-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-[10px] font-mono text-primary">{(u.name || "?").charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-foreground font-medium text-xs">{u.name || "—"}</span>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground text-xs">{u.email}</td>
                <td className="p-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    u.role === "ADMIN" ? "bg-primary/10 text-primary border border-primary/20" : "bg-border/20 text-muted-foreground"
                  }`}>{u.role}</span>
                </td>
                <td className="p-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleString("zh-CN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
