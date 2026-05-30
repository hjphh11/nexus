"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, MessageSquare, Layers, FileText } from "lucide-react";
import { getAdminBoards, adminCreateBoard, adminDeleteBoard, getAdminPosts, adminDeletePost } from "@/actions/admin";
import gsap from "gsap";

export default function AdminForum() {
  type BoardList = Awaited<ReturnType<typeof getAdminBoards>>;
  type PostList = Awaited<ReturnType<typeof getAdminPosts>>;
  const [boards, setBoards] = useState<BoardList>([]);
  const [posts, setPosts] = useState<PostList>([]);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAdminBoards().then(setBoards);
    getAdminPosts().then(setPosts);
  }, []);

  useEffect(() => {
    if (!boards.length && !posts.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".forum-stat-card", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" });
      gsap.fromTo(".forum-board-row", { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.04, ease: "power2.out", delay: 0.15 });
      gsap.fromTo(".forum-post-row", { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.02, ease: "power2.out", delay: 0.3 });
    }, containerRef);
    return () => ctx.revert();
  }, [boards, posts]);

  const totalPosts = boards.reduce((s, b) => s + b._count.posts, 0);

  return (
    <div ref={containerRef} className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-xl font-heading font-bold text-foreground">论坛管理</h1>
        <p className="text-xs text-muted-foreground mt-1">管理板块与帖子</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "板块数", value: boards.length, icon: Layers, color: "#00f0ff" },
          { label: "帖子总数", value: totalPosts, icon: MessageSquare, color: "#7c3aed" },
          { label: "帖子列表", value: posts.length, icon: FileText, color: "#f43f5e" },
        ].map((s, i) => (
          <div key={s.label} className="forum-stat-card rounded-xl bg-surface border border-border/30 p-4 flex items-center gap-4">
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

      {/* Boards */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-primary" /> 板块
        </h2>
        <button onClick={() => setShowNewBoard(!showNewBoard)}
          className="flex items-center gap-1 text-xs text-primary hover:underline transition-colors"><Plus className="w-3.5 h-3.5" /> 新增</button>
      </div>

      {showNewBoard && (
        <div className="flex gap-2 mb-4 p-4 rounded-xl bg-surface border border-border/30">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="名称" className="px-3 py-2 rounded-lg bg-surface-hover border border-border/40 text-sm flex-1 focus:outline-none focus:border-primary/40" />
          <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="slug" className="px-3 py-2 rounded-lg bg-surface-hover border border-border/40 text-sm w-32 focus:outline-none focus:border-primary/40" />
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="描述" className="px-3 py-2 rounded-lg bg-surface-hover border border-border/40 text-sm w-52 focus:outline-none focus:border-primary/40" />
          <button onClick={async () => { if (!newName) return; await adminCreateBoard(newName, newSlug, newDesc); setNewName(""); setNewSlug(""); setNewDesc(""); setShowNewBoard(false); getAdminBoards().then(setBoards); }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">创建</button>
        </div>
      )}

      <div className="rounded-xl bg-surface border border-border/30 overflow-hidden mb-10">
        <table className="w-full text-sm">
          <thead className="border-b border-border/20 bg-surface-hover/50">
            <tr className="text-left text-muted-foreground text-xs"><th className="p-3 pl-5">名称</th><th className="p-3">Slug</th><th className="p-3">帖子</th><th className="p-3 w-16">操作</th></tr>
          </thead>
          <tbody>
            {boards.map((b) => (
              <tr key={b.id} className="forum-board-row border-b border-border/5 hover:bg-surface-hover transition-colors group">
                <td className="p-3 pl-5 text-foreground font-medium text-xs">{b.name}</td>
                <td className="p-3 text-muted-foreground text-[11px] font-mono">{b.slug}</td>
                <td className="p-3 text-muted-foreground text-xs">{b._count.posts}</td>
                <td className="p-3">
                  <button onClick={async () => { if (confirm("删除板块将同时删除所有帖子，确定？")) { await adminDeleteBoard(b.id); setBoards((p) => p.filter((x) => x.id !== b.id)); } }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent/10 text-muted-foreground hover:text-accent transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Posts */}
      <h2 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2 mb-4">
        <FileText className="w-3.5 h-3.5 text-secondary" /> 帖子
      </h2>
      <div className="rounded-xl bg-surface border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border/20 bg-surface-hover/50">
            <tr className="text-left text-muted-foreground text-xs"><th className="p-3 pl-5">标题</th><th className="p-3">作者</th><th className="p-3">板块</th><th className="p-3">时间</th><th className="p-3 w-16">操作</th></tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr><td colSpan={5} className="p-12 text-center text-muted-foreground text-xs">暂无帖子</td></tr>
            ) : (
              posts.map((p) => (
                <tr key={p.id} className="forum-post-row border-b border-border/5 hover:bg-surface-hover transition-colors group">
                  <td className="p-3 pl-5 text-foreground text-xs truncate max-w-[300px] font-medium">{p.title}</td>
                  <td className="p-3 text-muted-foreground text-xs">{p.author?.name || "—"}</td>
                  <td className="p-3 text-muted-foreground text-[11px]">{p.board?.name}</td>
                  <td className="p-3 text-muted-foreground text-[11px]">{new Date(p.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td className="p-3">
                    <button onClick={async () => { if (confirm("确定删除？")) { await adminDeletePost(p.id); setPosts((prev) => prev.filter((x) => x.id !== p.id)); } }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent/10 text-muted-foreground hover:text-accent transition-all">
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
