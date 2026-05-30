"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Trash2, Eye, FileText, HardDrive } from "lucide-react";
import { getAdminResources, adminDeleteResource } from "@/actions/admin";
import gsap from "gsap";

const typeOptions = ["ALL", "DOCUMENT", "DATASET", "CODE", "IMAGE", "OTHER"];

export default function AdminResources() {
  type ResList = Awaited<ReturnType<typeof getAdminResources>>;
  const [resources, setResources] = useState<ResList>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLoading(true); getAdminResources(search, type === "ALL" ? undefined : type).then((r) => { setResources(r); setLoading(false); }); }, [search, type]);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".res-stat-card", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" });
      gsap.fromTo(".res-table-row", { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.03, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, [resources, loading]);

  const totalViews = resources.reduce((s, r) => s + r.views, 0);
  const totalDownloads = resources.reduce((s, r) => s + r.downloads, 0);
  const totalSize = resources.reduce((s, r) => s + (r.fileSize || 0), 0);

  return (
    <div ref={containerRef} className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">资源管理</h1>
          <p className="text-xs text-muted-foreground mt-1">管理所有上传资源</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "资源总数", value: resources.length, icon: FileText, color: "#00f0ff" },
          { label: "总浏览量", value: totalViews.toLocaleString(), icon: Eye, color: "#f43f5e" },
          { label: "存储估算", value: `${(totalSize / 1024 / 1024).toFixed(1)} MB`, icon: HardDrive, color: "#7c3aed" },
        ].map((s, i) => (
          <div key={s.label} className="res-stat-card rounded-xl bg-surface border border-border/30 p-4 flex items-center gap-4">
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

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索资源..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border/50 text-sm focus:outline-none focus:border-primary/40 transition-all" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-surface border border-border/40 text-xs cursor-pointer focus:outline-none focus:border-primary/40">
          {typeOptions.map((t) => <option key={t} value={t}>{t === "ALL" ? "全部类型" : t}</option>)}
        </select>
      </div>

      <div className="rounded-xl bg-surface border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border/20 bg-surface-hover/50">
            <tr className="text-left text-muted-foreground text-xs">
              <th className="p-3 pl-5 font-medium">标题</th><th className="p-3 font-medium">作者</th><th className="p-3 font-medium">类型</th><th className="p-3 font-medium">浏览</th><th className="p-3 font-medium">时间</th><th className="p-3 font-medium w-16">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-12 text-center text-muted-foreground text-xs">加载中...</td></tr>
            ) : resources.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-muted-foreground text-xs">无结果</td></tr>
            ) : (
              resources.map((r) => (
                <tr key={r.id} className="res-table-row border-b border-border/5 hover:bg-surface-hover transition-colors group">
                  <td className="p-3 pl-5">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-primary/50 shrink-0" />
                      <span className="text-foreground font-medium text-xs truncate max-w-[280px] block">{r.title}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{r.author?.name || "—"}</td>
                  <td className="p-3"><span className="text-[10px] px-1.5 py-0.5 rounded bg-border/20 text-muted-foreground">{r.type}</span></td>
                  <td className="p-3 text-muted-foreground text-xs">{r.views}</td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(r.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td className="p-3">
                    <button onClick={async () => { if (confirm("确定删除此资源？")) { await adminDeleteResource(r.id); setResources((p) => p?.filter((x) => x.id !== r.id)); } }}
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
