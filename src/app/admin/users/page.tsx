"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Trash2, Users, Shield, UserX } from "lucide-react";
import { getAdminUsers, updateUserRole, adminDeleteUser } from "@/actions/admin";
import gsap from "gsap";

export default function AdminUsers() {
  type UserList = Awaited<ReturnType<typeof getAdminUsers>>;
  const [users, setUsers] = useState<UserList>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLoading(true); getAdminUsers(search).then((u) => { setUsers(u); setLoading(false); }); }, [search]);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".user-stat-card", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" });
      gsap.fromTo(".user-table-row", { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.03, ease: "power2.out", delay: 0.2 });
    }, containerRef);
    return () => ctx.revert();
  }, [users, loading]);

  const admins = users.filter((u) => u.role === "ADMIN").length;
  const totalResources = users.reduce((s, u) => s + u._count.resources, 0);
  const totalPosts = users.reduce((s, u) => s + u._count.posts, 0);

  return (
    <div ref={containerRef} className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">用户管理</h1>
          <p className="text-xs text-muted-foreground mt-1">管理所有注册用户</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "总用户", value: users.length, icon: Users, color: "#00f0ff" },
          { label: "管理员", value: admins, icon: Shield, color: "#f59e0b" },
          { label: "资源 / 帖子", value: `${totalResources} / ${totalPosts}`, icon: UserX, color: "#7c3aed" },
        ].map((s, i) => (
          <div key={s.label} className="user-stat-card rounded-xl bg-surface border border-border/30 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-foreground">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索用户..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border/50 text-sm focus:outline-none focus:border-primary/40 transition-all" />
      </div>

      <div className="rounded-xl bg-surface border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border/20 bg-surface-hover/50">
            <tr className="text-left text-muted-foreground text-xs">
              <th className="p-3 pl-5 font-medium">用户</th><th className="p-3 font-medium">邮箱</th><th className="p-3 font-medium">内容</th><th className="p-3 font-medium">角色</th><th className="p-3 font-medium">注册时间</th><th className="p-3 font-medium w-16">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-12 text-center text-muted-foreground text-xs">加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-muted-foreground text-xs">无结果</td></tr>
            ) : (
              users.map((u, i) => (
                <tr key={u.id} className="user-table-row border-b border-border/5 hover:bg-surface-hover transition-colors group">
                  <td className="p-3 pl-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-[10px] font-mono text-primary">{(u.name || "?").charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-foreground font-medium text-xs">{u.name || "—"}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{u.email}</td>
                  <td className="p-3 text-muted-foreground text-[11px]">{u._count.resources} 资源 · {u._count.posts} 帖</td>
                  <td className="p-3">
                    <select value={u.role} onChange={async (e) => { await updateUserRole(u.id, e.target.value); setUsers((prev) => prev?.map((x) => x.id === u.id ? { ...x, role: e.target.value } : x)); }}
                      className="text-[10px] px-2 py-1 rounded bg-surface-hover border border-border/40 text-foreground cursor-pointer focus:outline-none focus:border-primary/40">
                      <option value="USER">USER</option><option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td className="p-3">
                    <button onClick={async () => { if (confirm(`删除用户 ${u.name || u.email}？`)) { await adminDeleteUser(u.id); setUsers((prev) => prev?.filter((x) => x.id !== u.id)); } }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent/10 text-muted-foreground hover:text-accent transition-all" title="删除">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
