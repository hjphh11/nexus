"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, MessageSquare, Eye, Heart, Upload, Plus, Search, Clock,
  FileText, ArrowRight, LayoutDashboard, Pencil, Trash2, Check, X,
} from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";
import { deleteResource } from "@/actions/resources";
import { CountUp } from "@/components/effects/count-up";
import { HolographicTilt } from "@/components/effects/holographic-tilt";

const statsConfig = [
  { key: "resources", label: "我的资源", icon: Database, color: "text-primary" },
  { key: "posts", label: "论坛帖子", icon: MessageSquare, color: "text-secondary" },
  { key: "views", label: "总浏览量", icon: Eye, color: "text-chart-4" },
  { key: "upvotes", label: "获赞数", icon: Heart, color: "text-accent" },
] as const;

const quickActions = [
  { href: "/upload", label: "上传资源", icon: Upload, desc: "分享文件、数据、代码" },
  { href: "/forum", label: "发帖讨论", icon: Plus, desc: "参与技术话题讨论" },
  { href: "/resources", label: "浏览资源", icon: Search, desc: "探索社区资源库" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboardData>>>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{
    id: string; title: string; description: string; type: string; tags: string;
    hasFile: boolean; fileName: string; fileSize: number | null;
    images: string[];
  } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [editImages, setEditImages] = useState<File[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<Set<number>>(new Set());

  useEffect(() => {
    getDashboardData().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (!session?.user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <LayoutDashboard className="w-16 h-16 text-primary/20 mx-auto mb-6" />
        <h1 className="text-2xl font-heading font-bold text-foreground mb-3">请先登录</h1>
        <Link href="/auth" className="text-primary hover:underline">前往登录</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-10">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-1">
            <span className="text-primary">//</span> 仪表盘
          </h1>
          <p className="text-muted-foreground text-sm">欢迎回来，{session.user.name || session.user.email}</p>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map((i) => (<div key={i} className="rounded-xl bg-surface border border-border/30 p-6 h-28 shimmer-bg" />))}
            </div>
            <div className="grid lg:grid-cols-3 gap-4">
              {[1,2,3].map((i) => (<div key={i} className="rounded-xl bg-surface border border-border/30 p-8 h-24 shimmer-bg" />))}
            </div>
          </div>
        ) : data ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statsConfig.map((stat, i) => (
                <motion.div key={stat.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <div className="relative rounded-xl bg-surface border border-border/40 p-6 overflow-hidden">
                    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    <div className="flex items-center justify-between mb-3"><stat.icon className={`w-5 h-5 ${stat.color}`} /><span className="w-1.5 h-1.5 rounded-full bg-primary/40" /></div>
                    <div className="text-2xl font-bold font-mono text-foreground"><CountUp end={data.stats[stat.key]} duration={1500} /></div>
                    <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {quickActions.map((action, i) => (
                <motion.div key={action.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
                  <HolographicTilt className="h-full">
                    <Link href={action.href} className="block p-5 rounded-xl bg-surface border border-border/40 hover:border-primary/20 transition-all">
                      <action.icon className="w-5 h-5 text-primary mb-3" />
                      <h3 className="text-sm font-heading font-semibold text-foreground mb-1">{action.label}</h3>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </Link>
                  </HolographicTilt>
                </motion.div>
              ))}
            </div>

            {/* My Resources + Recent Posts */}
            <div className="grid lg:grid-cols-2 gap-8 mb-10">
              {/* My Resources */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" /> 我的资源
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground">{data.recentResources.length} 个</span>
                    <Link href="/upload" className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> 上传</Link>
                  </div>
                </div>
                {data.recentResources.length === 0 ? (
                  <div className="rounded-xl bg-surface border border-border/30 p-8 text-center">
                    <FileText className="w-8 h-8 text-primary/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">还没有上传资源</p>
                    <Link href="/upload" className="text-xs text-primary hover:underline">去上传</Link>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                    {data.recentResources.map((r) => (
                      <div key={r.id} className="group flex items-center justify-between p-3 rounded-xl bg-surface border border-border/30 hover:border-primary/20 hover:bg-surface-hover transition-all">
                        <Link href={`/resources/${r.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-primary/60 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-sm text-foreground truncate block">{r.title}</span>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" />{r.views}</span>
                              <span>{new Date(r.createdAt).toLocaleDateString("zh-CN")}</span>
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                          <button
                            onClick={() => {
                              setEditing({
                                id: r.id, title: r.title, description: r.description || "", type: r.type,
                                tags: (r.tags as string[]).join(", "), hasFile: !!r.fileUrl,
                                fileName: (r as any).fileName || "", fileSize: (r as any).fileSize || null,
                                images: r.images || [],
                              });
                              setEditFile(null); setRemoveFile(false); setEditImages([]); setImagesToRemove(new Set());
                            }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="编辑"
                          ><Pencil className="w-3.5 h-3.5" /></button>
                          <button
                            onClick={async () => { if (confirm("确定删除？")) { await deleteResource(r.id); getDashboardData().then(setData); } }}
                            className="p-1.5 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors" title="删除"
                          ><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Posts */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-secondary" /> 最近帖子
                  </h2>
                  <Link href="/forum" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">全部 <ArrowRight className="w-3 h-3" /></Link>
                </div>
                {data.recentPosts.length === 0 ? (
                  <div className="rounded-xl bg-surface border border-border/30 p-8 text-center">
                    <MessageSquare className="w-8 h-8 text-secondary/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">还没有发过帖子</p>
                    <Link href="/forum" className="text-xs text-primary hover:underline">去发帖</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.recentPosts.map((p) => (
                      <Link key={p.id} href={`/forum/${p.board.slug}/${p.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/30 hover:border-primary/20 hover:bg-surface-hover transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <MessageSquare className="w-4 h-4 text-secondary/60 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-sm text-foreground truncate block">{p.title}</span>
                              <span className="text-[10px] text-muted-foreground">{p.board.name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0 ml-4">
                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{p._count.comments}</span>
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{p.upvotes}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Activity Timeline */}
            <div>
              <h2 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-chart-4" /> 最近动态</h2>
              {data.recentComments.length === 0 ? (
                <div className="rounded-xl bg-surface border border-border/30 p-8 text-center">
                  <Clock className="w-8 h-8 text-primary/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">还没有活动记录</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.recentComments.map((c) => (
                    <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl bg-surface border border-border/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground truncate">
                          评论了{" "}
                          {c.resource ? (
                            <Link href={`/resources/${c.resource.id}`} className="text-primary hover:underline">{c.resource.title}</Link>
                          ) : c.post ? (
                            <Link href={`/forum/${""}/${c.post.id}`} className="text-primary hover:underline">{c.post.title}</Link>
                          ) : null}
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">{new Date(c.createdAt).toLocaleDateString("zh-CN")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] p-6">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditing(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-surface border border-border/40 shadow-2xl p-6">
              <h2 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2 mb-5">
                <Pencil className="w-4 h-4 text-primary" /> 编辑资源
              </h2>
              <div className="space-y-4">
                <input value={editing.title} onChange={(e) => setEditing((p) => p ? { ...p, title: e.target.value } : null)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="资源名称" />
                <textarea value={editing.description} onChange={(e) => setEditing((p) => p ? { ...p, description: e.target.value } : null)} rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none" placeholder="描述（可选）" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={editing.type} onChange={(e) => setEditing((p) => p ? { ...p, type: e.target.value } : null)}
                    className="px-4 py-2.5 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="类型" />
                  <input value={editing.tags} onChange={(e) => setEditing((p) => p ? { ...p, tags: e.target.value } : null)}
                    className="px-4 py-2.5 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="标签（逗号分隔）" />
                </div>

                {/* File */}
                <div className="rounded-xl bg-surface-hover border border-border/30 p-4 space-y-3">
                  <p className="text-xs text-muted-foreground font-medium">文件</p>
                  {editing.hasFile && !removeFile ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground truncate max-w-[300px]">{editing.fileName}{editing.fileSize ? ` (${(editing.fileSize / 1024 / 1024).toFixed(1)} MB)` : ""}</span>
                      <button onClick={() => { setRemoveFile(true); setEditFile(null); }} className="text-xs text-accent hover:underline shrink-0 ml-2">移除</button>
                    </div>
                  ) : null}
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border/40 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" /> {editFile ? editFile.name : removeFile ? "替换文件" : editing.hasFile ? "替换文件" : "上传文件"}
                    <input type="file" className="hidden" onChange={(e) => { setEditFile(e.target.files?.[0] || null); setRemoveFile(false); }} />
                  </label>
                </div>

                {/* Images */}
                <div className="rounded-xl bg-surface-hover border border-border/30 p-4 space-y-3">
                  <p className="text-xs text-muted-foreground font-medium">展示图片</p>
                  {editing.images.length > 0 && !removeFile && (
                    <div className="flex flex-wrap gap-2">
                      {editing.images.map((img, i) => (
                        <div key={i} className={`relative w-16 h-16 rounded-lg overflow-hidden border ${imagesToRemove.has(i) ? "border-accent/50 opacity-40" : "border-border/30"}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => setImagesToRemove((s) => { const ns = new Set(s); ns.has(i) ? ns.delete(i) : ns.add(i); return ns; })}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
                            <X className="w-2.5 h-2.5 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border/40 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" /> 添加图片
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => setEditImages((prev) => [...prev, ...Array.from(e.target.files || [])])} />
                  </label>
                  {editImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {editImages.map((img, i) => (
                        <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-primary/30">
                          <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => setEditImages((p) => p.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/60 flex items-center justify-center">
                            <X className="w-2 h-2 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-colors">取消</button>
                <button onClick={async () => {
                  setEditSaving(true);
                  const fd = new FormData();
                  fd.append("title", editing.title);
                  fd.append("description", editing.description);
                  fd.append("type", editing.type);
                  fd.append("tags", editing.tags);
                  if (editFile) fd.append("file", editFile);
                  if (removeFile) fd.append("removeFile", "true");
                  fd.append("removeImages", Array.from(imagesToRemove).join(","));
                  editImages.forEach((img) => fd.append("images", img));
                  await fetch(`/api/resources/${editing.id}`, { method: "PATCH", body: fd });
                  setEditSaving(false); setEditing(null);
                  getDashboardData().then(setData);
                }} disabled={editSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:neon-glow transition-all disabled:opacity-50">
                  <Check className="w-4 h-4" /> {editSaving ? "保存中..." : "保存"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
